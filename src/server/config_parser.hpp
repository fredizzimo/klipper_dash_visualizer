#pragma once
#include <string>
#include <functional>
#include <charconv>
#include "parser_error.hpp"

class ConfigParser
{
public:
    class IFileReader
    {
    public:
        virtual void readFile(const std::string& filename, const std::string& parent_filename, std::function<void (const char* buffer)> callback) = 0;
    };

    ConfigParser(const std::string& filename, IFileReader& file_reader);

    template<typename T>
    T get(const std::string& section, const std::string& name) const;

    bool hasValue(const std::string& section, const std::string& name) const
    {
        return m_values.find(section + "." + name) != m_values.end();
    }
private:
    void loadFile(const std::string& filename);
    void parseValue(const std::string& section, const std::string& name, const std::string& value);
    void parseSection(const std::string& section);
    static int valueHandler(void* user, const char* section, const char* name, const char* value);
    std::unordered_map<std::string, std::string> m_values;

    IFileReader& m_file_reader;
    std::vector<std::string> m_filename_stack;
};

template<>
inline std::string ConfigParser::get<std::string>(const std::string& section, const std::string& name) const
{
    try
    {
        return m_values.at(section + "." + name);
    }
    catch(std::out_of_range)
    {
        throw ParserError("Invalid config file: '[%s] %s' not found", section.c_str(), name.c_str());
    }
}

template<typename T>
inline T ConfigParser::get(const std::string& section, const std::string& name) const
{
    try
    {
        const std::string& str = m_values.at(section + "." + name);
        T value;
        auto res = std::from_chars(str.data(), str.data() + str.size(), value);
        if (res.ec == std::errc::invalid_argument)
        {
            throw ParserError("Invalid config file '[%s] %s' is not of the correct type", section.c_str(), name.c_str());
        }
        else if(res.ec == std::errc::result_out_of_range)
        {
            throw ParserError("Invalid config file '[%s] %s' is out of range", section.c_str(), name.c_str());
        }

        return value;
    }
    catch(std::out_of_range)
    {
        throw ParserError("Invalid config file: '[%s] %s' not found", section.c_str(), name.c_str());
    }
}