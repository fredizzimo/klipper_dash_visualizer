#pragma once
#include <unordered_map>
#include <nlohmann/json_fwd.hpp>

class PinResolver
{
public:
    PinResolver(const nlohmann::json& config);
    unsigned getPin(const std::string& pin);

    bool isInverted(const std::string& pin);
    bool hasPullUp(const std::string& pin);
    bool hasPullDown(const std::string& pin);
private:
    std::unordered_map<std::string, unsigned> m_name_to_num;
};