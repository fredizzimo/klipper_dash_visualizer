#include "config_parser.hpp"
#include <ini.h>
#include <cctype>

namespace
{
    const std::string include = "include";
}

ConfigParser::ConfigParser(const std::string& filename, IFileReader& file_reader)
    : m_file_reader(file_reader)
{
    loadFile(filename);
}

void ConfigParser::loadFile(const std::string& filename)
{
    std::string parent_file = "";
    if (!m_filename_stack.empty())
    {
        parent_file = m_filename_stack.back();
    }
    m_filename_stack.push_back(filename);
    auto action = [this](const char* buffer)
    {
        ini_parse_string(buffer, ConfigParser::valueHandler, this);
    };
    m_file_reader.readFile(filename, parent_file, action);
    m_filename_stack.pop_back();
}

void ConfigParser::parseValue(const std::string& section, const std::string& name, const std::string& value)
{
    std::string key = section + "." + name;
    std::transform(key.begin(), key.end(), key.begin(), [](auto c) { return std::tolower(c); });
    m_values[key] = value;
}

void ConfigParser::parseSection(const std::string& section)
{
    std::string lower_section;
    lower_section.reserve(section.size());
    std::transform(section.begin(), section.end(), std::back_inserter(lower_section), [](auto c) { return std::tolower(c); });
    if (lower_section.find(include) == 0)
    {
        auto firstnonspace = std::find_if(section.begin() + include.size(), section.end(), [](char c)
        {
            return c != ' ';
        });
        std::string filename{firstnonspace, section.end()};
        loadFile(filename);
    }
}

int ConfigParser::valueHandler(void* user, const char* section, const char* name, const char* value)
{
    ConfigParser* parser = reinterpret_cast<ConfigParser*>(user);
    if (name == nullptr)
    {
        parser->parseSection(section);
    }
    else
    {
        parser->parseValue(section, name, value);
    }
    return 1;
}