#pragma once
#include <string>
#include <stdexcept>

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
private:
    std::string m_dictionary;
};