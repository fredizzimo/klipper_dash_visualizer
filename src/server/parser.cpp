#include "parser.hpp"
#include "config_parser.hpp"
#include "kinematics.hpp"
#include "cartesian.hpp"
#include "parser_error.hpp"
#include <zlib.h>
#include <vector>
#include <string_view>
#include <filesystem>
#include <nlohmann/json.hpp>

#include <iostream>

using json = nlohmann::json;

namespace
{
    class ConfigFileReader : public ConfigParser::IFileReader
    {
    public:
        virtual void readFile(const std::string& filename, const std::string& parent_filename, std::function<void (const char* buffer)> callback)
        {
            std::filesystem::path full_filename = parent_filename;
            full_filename.remove_filename();
            full_filename /= filename;
            auto f = fopen(full_filename.c_str(), "r");
            if (!f)
            {
                char* err = strerror(errno);
                throw ParserError("Could not open the config file %s: %s\n", full_filename.c_str(), err);
            }
            fseek(f, 0, SEEK_END);
            auto size = ftell(f);
            fseek(f, 0, SEEK_SET);
            char* buffer = new char[size];
            fread(buffer, 1, size, f);
            fclose(f);
            callback(buffer);
            delete [] buffer;
        }
    };
}

Parser::Parser(const std::string& config, const std::string& dictionary)
{
    loadDict(dictionary);
    loadConfig(config);
    registerCommandHandler("config_stepper", &Parser::configStepper);
}

Parser::~Parser()
{
}

void Parser::loadConfig(const std::string& filename)
{

    ConfigFileReader file_reader;
    ConfigParser parser(filename, file_reader);
    std::string kinematics = parser.get<std::string>("printer", "kinematics");
    if (kinematics == "cartesian")
    {
        m_kinematics = std::make_unique<Cartesian>(parser, *m_pin_resolver);
    }
    else
    {
        throw ParserError("Only cartesian kinematics supported at the moment");
    }
    for (size_t i=0;i<m_kinematics->getNumSteppers();i++)
    {
        Stepper& stepper = m_kinematics->getStepper(i);
        if (m_steppers_by_pin.size() <= stepper.getPin())
        {
            m_steppers_by_pin.resize(stepper.getPin() + 1);
        }
        m_steppers_by_pin[stepper.getPin()] = &stepper;
    }
}

void Parser::loadDict(const std::string& filename)
{
    auto dict = gzopen(filename.c_str(), "rb");
    if (dict)
    {
        std::vector<char> buffer;

        while (true)
        {
            const size_t pos = buffer.size();
            buffer.resize(buffer.size() + 4096);
            int read = gzread(dict, &buffer.front() + pos, 4096);
            if (read < 4096)
            {
                gzclose(dict);
                if (read >= 0)
                {
                    buffer.resize(pos + read);
                }
                else if (read == -1)
                {
                    throw ParserError("Failed to decompress. The dictionary file %s appears to be corrupted", filename.c_str());
                }
                break;
            }
        }

        try
        {
            auto j = json::parse(buffer.begin(), buffer.end());
            #if 1
                std::cout << j.dump(4);
                std::cout << std::endl;
            #endif
            generateCommands(j);
            m_pin_resolver = std::make_unique<PinResolver>(j);
        }
        catch (json::exception e)
        {
            throw ParserError("Failed to load json. The dictionary file %s appears to be corrupted", filename.c_str());
        }
    }
    else
    {
        throw ParserError("Could not open dictionary file %s", filename.c_str());
    }
}

void Parser::generateCommands(nlohmann::json& json)
{
    auto& commands = json["commands"];
    std::unordered_map<std::string, ArgumentType> string_to_arg_type = {
        {"%u", ArgumentType::Uint32},
        {"%i", ArgumentType::Int32},
        {"%hu", ArgumentType::Uint16},
        {"%hi", ArgumentType::Int16},
        {"%c", ArgumentType::Byte},
        {"%s", ArgumentType::String},
        {"%.*s", ArgumentType::Progmem},
        {"%*s", ArgumentType::Buffer}
    };
    for (auto& [key, value] : commands.items())
    {
        uint8_t command_id = value.get<uint8_t>();
        auto command_end = std::find(key.begin(), key.end(), ' ');
        std::string command_name{key.begin(), command_end};
        std::vector<ArgumentType> arguments;
        std::vector<std::string> argument_names;
        if (command_end != key.end())
        {
            auto arg_start = command_end + 1;
            while(arg_start != key.end())
            {
                auto arg_end = std::find(arg_start, key.end(), '=');
                std::string arg_name{arg_start, arg_end};
                auto arg_type_start = arg_end + 1;
                auto arg_type_end = std::find(arg_type_start, key.end(), ' ');
                std::string arg_type{arg_type_start, arg_type_end};
                arg_start = arg_type_end;
                try
                {
                    arguments.push_back(string_to_arg_type.at(arg_type));
                }
                catch (std::out_of_range& e)
                {
                    throw ParserError("Invalid dictionary, argument type %s is unknown", arg_type.c_str());
                }
                argument_names.push_back(arg_name);
                if (arg_start != key.end())
                {
                    arg_start += 1;
                }
            }
        }
        m_commands.emplace(command_id, std::move(arguments));
        m_command_arg_names.emplace(command_id, std::move(argument_names));
        m_command_names.emplace(command_id, command_name);
        m_command_name_to_id.emplace(command_name, command_id);
    }
}

namespace
{
    constexpr size_t MESSAGE_MIN = 5;
    constexpr size_t MESSAGE_MAX = 64;
    constexpr size_t MESSAGE_HEADER_SIZE  = 2;
    constexpr size_t MESSAGE_TRAILER_SIZE = 3;
    constexpr size_t MESSAGE_POS_LEN = 0;
    constexpr size_t MESSAGE_POS_SEQ = 1;
    constexpr size_t MESSAGE_TRAILER_CRC  = 3;
    constexpr size_t MESSAGE_TRAILER_SYNC = 1;
    constexpr size_t MESSAGE_PAYLOAD_MAX = MESSAGE_MAX - MESSAGE_MIN;
    constexpr uint8_t MESSAGE_SEQ_MASK = 0x0f;
    constexpr uint8_t MESSAGE_DEST = 0x10;
    constexpr uint8_t MESSAGE_SYNC = '\x7E';

    class SerialFileReader
    {
    public:
        class EndOfFile : public std::exception
        {
        public:
            EndOfFile(bool error) : m_error(error) {}
            bool m_error;
        };

        SerialFileReader(const std::string& filename)
        {
            m_file = fopen(filename.c_str(), "rb");
            if (!m_file)
            {
                char* err = strerror(errno);
                throw ParserError("Could not open serial input file %s: %s\n", filename.c_str(), err);
            }
        }
        ~SerialFileReader()
        {
            fclose(m_file);
        }
        template<typename T>
        T read()
        {
            T value;
            readBytes(&value, sizeof(T));
            return value;
        }

        void readBytes(void* buffer, size_t size)
        {
            if (!ensureSpace(size))
            {
                throw EndOfFile(true);
            }
            memcpy(buffer, m_buffer + m_readPos, size);
            m_readPos += size;
            m_left -= size;
        }

        std::tuple<uint8_t, const uint8_t*> readMessage()
        {
            if (!ensureSpace(1))
            {
                throw EndOfFile(true);
            }
            const uint8_t msg_len = m_buffer[m_readPos];

            if (msg_len < MESSAGE_MIN || msg_len > MESSAGE_MAX)
            {
                throw ParserError("The serial input file is corrupted: invalid message length");
            }

            if (!ensureSpace(msg_len))
            {
                throw EndOfFile(true);
            }

            m_readPos += msg_len;
            m_left -= msg_len;
            return {msg_len, reinterpret_cast<const uint8_t*>(m_buffer + m_readPos - msg_len)};
        }
    private:
        bool hasSpace(size_t requestedSize)
        {
            return m_left >= requestedSize;
        }

        bool ensureSpace(size_t requestedSize)
        {
            if (!hasSpace(requestedSize))
            {
                fillBuffer();
            }
            return hasSpace(requestedSize);
        }

        void fillBuffer()
        {
            memmove(m_buffer, m_buffer + m_readPos, m_left);
            m_readPos = 0;
            int read = fread(m_buffer + m_left, 1, sizeof(m_buffer) - m_left, m_file);
            if (read > 0)
            {
                m_left += read;
            }
            else if (read == 0)
            {
                throw EndOfFile(false);
            }
            else
            {
                throw EndOfFile(true);
            }
        }

        FILE* m_file;
        char m_buffer[4096];
        size_t m_readPos = 0;
        size_t m_left = 0;
    };

    uint16_t crc16_ccitt(const uint8_t* buf, size_t len)
    {
        uint16_t crc = 0xffff;
        while (len--)
        {
            uint8_t data = *buf++;
            data ^= crc & 0xff;
            data ^= data << 4;
            crc = ((((uint16_t)data << 8) | (crc >> 8)) ^ (uint8_t)(data >> 4)
                   ^ ((uint16_t)data << 3));
        }
        return crc;
    }

    void validateMessage(uint8_t msg_len, const uint8_t* buffer)
    {
        const uint8_t msg_seq = buffer[MESSAGE_POS_SEQ];
        if ((msg_seq & ~MESSAGE_SEQ_MASK) != MESSAGE_DEST)
        {
            throw ParserError("The serial input file is corrupted: invalid message sequence");
        }

        if (buffer[msg_len-MESSAGE_TRAILER_SYNC] != MESSAGE_SYNC)
        {
            throw ParserError("The serial input file is corrupted: missing sync");
        }
        uint16_t msg_crc = ((buffer[msg_len-MESSAGE_TRAILER_CRC] << 8) | buffer[msg_len-MESSAGE_TRAILER_CRC+1]);
        const uint16_t crc = crc16_ccitt(buffer, msg_len - MESSAGE_TRAILER_SIZE);
        if (msg_crc != crc)
        {
            throw ParserError("The serial input file is corrupted: crc mismatch");
        }
    }

    uint32_t decodeVLQ(const uint8_t*& buffer)
    {
        uint8_t byte = *buffer++;
        uint32_t value = byte & 0x7f;
        if ((byte & 0x60) == 0x60)
        {
            value |= -0x20;
        }
        while (byte & 0x80)
        {
            byte = *buffer++;
            value = (value<<7) | (byte & 0x7f);
        }
        return value;
    }
}

void Parser::parse(const std::string& filename)
{
    SerialFileReader reader(filename);
    try
    {
        while (true)
        {
            // 8 bytes for timestamp
            auto timestamp = reader.read<double>();
            auto [msg_len, message] = reader.readMessage();
            validateMessage(msg_len, message);
            auto end = message + msg_len - MESSAGE_TRAILER_SIZE;
            message += MESSAGE_HEADER_SIZE;
            while (message < end)
            {
                #if 1
                    readCommand(message);
                #else
                    printCommand(message);
                #endif
            }
        }
    }
    catch(SerialFileReader::EndOfFile& eof)
    {
        if (eof.m_error)
        {
            throw ParserError("The serial input file is corrupted");
        }
    }
}

void Parser::printCommand(const uint8_t*& buffer)
{
    uint32_t command_id = decodeVLQ(buffer);
    const auto& command = m_commands.at(command_id);
    const auto& arg_names = m_command_arg_names.at(command_id);
    auto arg_name = arg_names.begin();
    std::cout << m_command_names.at(command_id);
    for (auto arg: command)
    {
        std::cout << " " << *arg_name;
        if (arg < ArgumentType::NumberTypesEnd)
        {
            uint32_t value = decodeVLQ(buffer);
            switch(arg)
            {
                case ArgumentType::Uint32:
                    std::cout << " " << value;
                    break;
                case ArgumentType::Int32:
                    std::cout << " " << static_cast<int32_t>(value);
                    break;
                case ArgumentType::Uint16:
                    std::cout << " " << static_cast<uint16_t>(value);
                    break;
                case ArgumentType::Int16:
                    std::cout << " " << static_cast<int16_t>(value);
                    break;
                case ArgumentType::Byte:
                    std::cout << " " << (value & 0xFF);
                    break;
            }
        }
        else
        {
            uint8_t size = *buffer;
            std::string_view value(reinterpret_cast<const char*>(buffer + 1), size);
            std::cout << " " << value;
            buffer += size + 1;
        }
        ++arg_name;
    }
    std::cout << std::endl;
}

void Parser::readCommand(const uint8_t*& buffer)
{
    uint32_t command_id = decodeVLQ(buffer);
    auto handler = m_command_handlers.find(command_id);
    if (handler != m_command_handlers.end())
    {
        handler->second(buffer);
    }
    else
    {
        const auto& command = m_commands.at(command_id);
        for (auto arg: command)
        {
            if (arg < ArgumentType::NumberTypesEnd)
            {
                decodeVLQ(buffer);
            }
            else
            {
                uint8_t size = *buffer;
                buffer += size + 1;
            }
        }
    }
}

template<typename T>
struct Parser::RuntimeType
{
    static constexpr Parser::ArgumentType type = Parser::ArgumentType::Undefined;
};
template<>
struct Parser::RuntimeType<uint32_t>
{
    static constexpr Parser::ArgumentType type = Parser::ArgumentType::Uint32;
};
template<>
struct Parser::RuntimeType<int32_t>
{
    static constexpr Parser::ArgumentType type = Parser::ArgumentType::Int32;
};
template<>
struct Parser::RuntimeType<uint16_t>
{
    static constexpr Parser::ArgumentType type = Parser::ArgumentType::Uint16;
};
template<>
struct Parser::RuntimeType<int16_t>
{
    static constexpr Parser::ArgumentType type = Parser::ArgumentType::Int16;
};
template<>
struct Parser::RuntimeType<uint8_t>
{
    static constexpr Parser::ArgumentType type = Parser::ArgumentType::Byte;
};
// String types not defined out of lazyness
// They probably need to use std::string_view, since they are not null terminated

template<typename... Args>
void Parser::registerCommandHandler(const std::string command_name, void (Parser::*func)(Args...))
{
    try
    {
        uint8_t command = m_command_name_to_id.at(command_name);
        const auto& args = m_commands.at(command);
        if (args.size() != sizeof...(Args))
        {
            throw ParserError("Incompatible dictionary file, command %s has the wrong number of arguments", command_name.c_str());
        }
        std::array<ArgumentType, sizeof...(Args)> runtime_argument_types = { RuntimeType<Args>::type... };
        if (!std::equal(args.begin(), args.end(), runtime_argument_types.begin()))
        {
            throw ParserError("Incompatible dictionary file, command %s has the wrong type of arguments", command_name.c_str());
        }
        auto f = [this, func](const uint8_t*& buffer)
        {
            auto caller = [this, func](Args... a)
            {
                (this->*func)(a...);
            };

            // The evaluation order of function arguments is not guaranteed, so use a temporary tuple
            std::tuple<Args...> args{static_cast<Args>(decodeVLQ(buffer))...};
            std::apply(caller, args);
        };
        m_command_handlers[command] = f;
    }
    catch(std::out_of_range)
    {
        throw ParserError("Incompatible dictionary file, command %s not found", command_name.c_str());
    }
}

void Parser::configStepper(uint8_t oid, uint8_t step_pin, uint8_t dir_pin, uint32_t min_stop_interval, uint8_t invert_step)
{
    if (step_pin < m_steppers_by_pin.size())
    {
        Stepper* stepper = m_steppers_by_pin[step_pin];
        if (stepper)
        {
            if (m_steppers_by_oid.size() <= oid)
            {
                m_steppers_by_oid.resize(oid+1);
            }
            m_steppers_by_oid[oid] = stepper;
        }
    }
}