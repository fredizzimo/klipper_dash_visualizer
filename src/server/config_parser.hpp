#pragma once
#include <string>
#include <functional>
#include <charconv>

class ConfigParser
{
public:
    class IFileReader
    {
    public:
        virtual void readFile(const std::string& filename, std::function<void (const char* buffer)> callback) = 0;
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
};

template<>
inline std::string ConfigParser::get<std::string>(const std::string& section, const std::string& name) const
{
    return m_values.at(section + "." + name);
}

template<typename T>
inline T ConfigParser::get(const std::string& section, const std::string& name) const
{
    const std::string& str = m_values.at(section + "." + name);
    T value;
    std::from_chars(str.data(), str.data() + str.size(), value);
    return value;
}