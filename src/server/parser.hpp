#pragma once
#include <string>
#include <unordered_map>
#include <vector>
#include <functional>
#include <nlohmann/json_fwd.hpp>
#include "pin_resolver.hpp"

class Kinematics;
class Stepper;

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
    void configStepper(uint8_t oid, uint8_t step_pin, uint8_t dir_pin, uint32_t min_stop_interval, uint8_t invert_step);
    template<typename... Args>
    void registerCommandHandler(const std::string command_name, void (Parser::*func)(Args...));
    template<typename T> friend struct RuntimeType;

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
        Undefined
    };
    template<typename T>
    struct RuntimeType;


    std::unordered_map<uint8_t, std::vector<ArgumentType>> m_commands;
    std::unordered_map<uint8_t, std::vector<std::string>> m_command_arg_names;
    std::unordered_map<uint8_t, std::string> m_command_names;
    std::unordered_map<std::string, uint8_t> m_command_name_to_id;
    std::unordered_map<uint8_t, std::function<void (const uint8_t*& buffer)>> m_command_handlers;
    std::unique_ptr<PinResolver> m_pin_resolver;

    std::unique_ptr<Kinematics> m_kinematics;

    std::vector<Stepper*> m_unresolved_steppers;
};