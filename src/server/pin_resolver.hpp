#pragma once
#include <unordered_map>
#include <nlohmann/json_fwd.hpp>

class PinResolver
{
public:
    PinResolver(const nlohmann::json& config);
    unsigned getPin(const std::string& pin) const;

    bool isInverted(const std::string& pin) const;
    bool hasPullUp(const std::string& pin) const;
    bool hasPullDown(const std::string& pin) const;
private:
    std::unordered_map<std::string, unsigned> m_name_to_num;
};