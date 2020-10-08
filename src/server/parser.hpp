#pragma once
#include <string>
#include <stdexcept>
#include <unordered_map>
#include <vector>
#include <nlohmann/json_fwd.hpp>

class ParserError : public std::runtime_error
{
public:
    template<typename ... Args>
    ParserError(const char* format, Args ... args) : std::runtime_error(formatString(format, args...)) {}
private:
    template<typename ... Args>
    static std::string formatString(const char* format, Args ... args)
    {
        char buffer[4096];
        size_t size = snprintf(buffer, 4096, format, args ...);
        return std::string(buffer, buffer + size);
    }
};

class Parser
{
public:
    Parser(const std::string& dictionary);
    void parse(const std::string& filename);
private:
    void generateCommands(nlohmann::json& json);
    void readCommand(const uint8_t*& buffer);
    void printCommand(const uint8_t*& buffer);

    enum class ArgumentType
    {
        Uint32 = 0,
        Int32,
        Uint16,
        Int16,
        Byte,
        NumberTypesEnd,
        String,
        Progmem,
        Buffer,
        StringTypesEnd,
    };
    std::unordered_map<uint8_t, std::vector<ArgumentType>> m_commands;
    std::unordered_map<uint8_t, std::vector<std::string>> m_command_arg_names;
    std::unordered_map<uint8_t, std::string> m_command_names;
    std::unordered_map<std::string, uint8_t> m_command_name_to_id;
    std::string m_dictionary;
};