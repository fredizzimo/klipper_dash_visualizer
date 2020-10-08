#include "pin_resolver.hpp"
#include <algorithm>
#include <cctype>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

namespace
{
    struct PinInfo
    {
        std::string name;
        bool isInverted = false;
        bool hasPullUp = false;
        bool hasPullDown = false;
    };

    PinInfo parsePin(const std::string pin)
    {
        PinInfo info;
        auto c = pin.begin();
        for (; c!=pin.end(); ++c)
        {
            if (*c == '!')
            {
                info.isInverted = true;
            }
            else if (*c == '^')
            {
                info.hasPullUp = true;
            }
            else if(*c == '~')
            {
                info.hasPullDown = true;
            }
            else
            {
                break;
            }
        }
        info.name.resize(pin.end() - c);
        std::transform(c, pin.end(), info.name.begin(), [](auto c) { return std::tolower(c); });
        return info;
    }
}

PinResolver::PinResolver(const json& config)
{
    auto enumerations = config.at("enumerations");
    auto pin = enumerations.at("pin");
    for (auto& [name, value] : pin.items()) {
        auto number_start = std::find_if(name.begin(), name.end(), [](auto& c)
        {
            return c>='0' && c <= '9';
        });
        std::string base{name.begin(), number_start};
        std::transform(base.begin(), base.end(), base.begin(), [](auto c) { return std::tolower(c); });
        int number = std::stoi(std::string{number_start, name.end()});
        unsigned start_pin = value[0].get<unsigned>();
        unsigned num_pins = value[1].get<unsigned>();

        for (unsigned i=start_pin; i < start_pin + num_pins; ++i)
        {
            char source[256];
            snprintf(source, sizeof(source), "%s%i", base.c_str(), number);
            number++;
            m_name_to_num[source] = i;
        }
    }
}

unsigned PinResolver::getPin(const std::string& pin)
{
    auto info = parsePin(pin);
    return m_name_to_num.at(info.name);
}

bool PinResolver::isInverted(const std::string& pin)
{
    auto info = parsePin(pin);
    return info.isInverted;
}

bool PinResolver::hasPullUp(const std::string& pin)
{
    auto info = parsePin(pin);
    return info.hasPullUp;
}

bool PinResolver::hasPullDown(const std::string& pin)
{
    auto info = parsePin(pin);
    return info.hasPullDown;
}