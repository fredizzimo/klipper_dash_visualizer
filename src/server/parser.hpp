#pragma once
#include <string>
#include <unordered_map>
#include <vector>
#include <nlohmann/json_fwd.hpp>
#include "pin_resolver.hpp"

class Kinematics;

class Parser
{
public:
    Parser(const std::string& config, const std::string& dictionary);
    ~Parser();
    void parse(const std::string& filename);
private:
    void loadConfig(const std::string& filename);
    void loadDict(const std::string& filename);
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
    std::unique_ptr<PinResolver> m_pin_resolver;

    std::unique_ptr<Kinematics> m_kinematics;
};