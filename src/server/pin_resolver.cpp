#include "pin_resolver.hpp"
#include "parser_error.hpp"
#include <algorithm>
#include <cctype>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

namespace
{
    const std::vector<const char*> arduino_standard = {
        "PD0", "PD1", "PD2", "PD3", "PD4", "PD5", "PD6", "PD7", "PB0", "PB1",
        "PB2", "PB3", "PB4", "PB5", "PC0", "PC1", "PC2", "PC3", "PC4", "PC5",
    };
    const std::vector<const char*> arduino_analog_standard = {
        "PC0", "PC1", "PC2", "PC3", "PC4", "PC5", "PE0", "PE1",
    };

    const std::vector<const char*> arduino_mega = {
        "PE0", "PE1", "PE4", "PE5", "PG5", "PE3", "PH3", "PH4", "PH5", "PH6",
        "PB4", "PB5", "PB6", "PB7", "PJ1", "PJ0", "PH1", "PH0", "PD3", "PD2",
        "PD1", "PD0", "PA0", "PA1", "PA2", "PA3", "PA4", "PA5", "PA6", "PA7",
        "PC7", "PC6", "PC5", "PC4", "PC3", "PC2", "PC1", "PC0", "PD7", "PG2",
        "PG1", "PG0", "PL7", "PL6", "PL5", "PL4", "PL3", "PL2", "PL1", "PL0",
        "PB3", "PB2", "PB1", "PB0", "PF0", "PF1", "PF2", "PF3", "PF4", "PF5",
        "PF6", "PF7", "PK0", "PK1", "PK2", "PK3", "PK4", "PK5", "PK6", "PK7",
    };
    const std::vector<const char*> arduino_analog_mega = {
        "PF0", "PF1", "PF2", "PF3", "PF4", "PF5",
        "PF6", "PF7", "PK0", "PK1", "PK2", "PK3", "PK4", "PK5", "PK6", "PK7",
    };

    const std::vector<const char*> sanguino = {
        "PB0", "PB1", "PB2", "PB3", "PB4", "PB5", "PB6", "PB7", "PD0", "PD1",
        "PD2", "PD3", "PD4", "PD5", "PD6", "PD7", "PC0", "PC1", "PC2", "PC3",
        "PC4", "PC5", "PC6", "PC7", "PA0", "PA1", "PA2", "PA3", "PA4", "PA5",
        "PA6", "PA7"
    };
    const std::vector<const char*> sanguino_analog = {
        "PA0", "PA1", "PA2", "PA3", "PA4", "PA5", "PA6", "PA7"
    };

    const std::vector<const char*> arduino_due = {
        "PA8", "PA9", "PB25", "PC28", "PA29", "PC25", "PC24", "PC23", "PC22","PC21",
        "PA28", "PD7", "PD8", "PB27", "PD4", "PD5", "PA13", "PA12", "PA11", "PA10",
        "PB12", "PB13", "PB26", "PA14", "PA15", "PD0", "PD1", "PD2", "PD3", "PD6",
        "PD9", "PA7", "PD10", "PC1", "PC2", "PC3", "PC4", "PC5", "PC6", "PC7",
        "PC8", "PC9", "PA19", "PA20", "PC19", "PC18", "PC17", "PC16", "PC15","PC14",
        "PC13", "PC12", "PB21", "PB14", "PA16", "PA24", "PA23", "PA22", "PA6","PA4",
        "PA3", "PA2", "PB17", "PB18", "PB19", "PB20", "PB15", "PB16", "PA1", "PA0",
        "PA17", "PA18", "PC30", "PA21", "PA25", "PA26", "PA27", "PA28", "PB23"
    };
    const std::vector<const char*> arduino_due_analog = {
        "PA16", "PA24", "PA23", "PA22", "PA6", "PA4", "PA3", "PA2", "PB17", "PB18",
        "PB19", "PB20"
    };

    const std::vector<const char*> adafruit_grandcentral = {
        "PB25", "PB24", "PC18", "PC19", "PC20",
        "PC21", "PD20", "PD21", "PB18", "PB2",
        "PB22", "PB23", "PB0", "PB1", "PB16",
        "PB17", "PC22", "PC23", "PB12", "PB13",
        "PB20", "PB21", "PD12", "PA15", "PC17",
        "PC16", "PA12", "PA13", "PA14", "PB19",
        "PA23", "PA22", "PA21", "PA20", "PA19",
        "PA18", "PA17", "PA16", "PB15", "PB14",
        "PC13", "PC12", "PC15", "PC14", "PC11",
        "PC10", "PC6", "PC7", "PC4", "PC5",
        "PD11", "PD8", "PD9", "PD10", "PA2",
        "PA5", "PB3", "PC0", "PC1", "PC2",
        "PC3", "PB4", "PB5", "PB6", "PB7",
        "PB8", "PB9", "PA4", "PA6", "PA7"
    };
    const std::vector<const char*> adafruit_grandcentral_analog = {
        "PA2", "PA5", "PB3", "PC0", "PC1", "PC2", "PC3", "PB4", "PB5", "PB6", "PB7",
        "PB8", "PB9", "PA4", "PA6", "PA7"
    };

    const std::unordered_map<std::string, std::tuple<const std::vector<const char*>&, const std::vector<const char*>&>> arduino_from_mcu = {
        {"atmega168", {arduino_standard, arduino_analog_standard}},
        {"atmega328", {arduino_standard, arduino_analog_standard}},
        {"atmega328p", {arduino_standard, arduino_analog_standard}},
        {"atmega644p", {sanguino, sanguino_analog}},
        {"atmega1280", {arduino_mega, arduino_analog_mega}},
        {"atmega2560", {arduino_mega, arduino_analog_mega}},
        {"sam3x8e", {arduino_due, arduino_due_analog}},
        {"samd51p20a", {adafruit_grandcentral, adafruit_grandcentral_analog}},
    };

    std::vector<std::tuple<const char*, const char*>> beaglebone_black = {
        {"P8_3", "GPIO1_6"}, {"P8_4", "GPIO1_7"}, {"P8_5", "GPIO1_2"},
        {"P8_6", "GPIO1_3"}, {"P8_7", "GPIO2_2"}, {"P8_8", "GPIO2_3"},
        {"P8_9", "GPIO2_5"}, {"P8_10", "GPIO2_4"}, {"P8_11", "GPIO1_13"},
        {"P8_12", "GPIO1_12"}, {"P8_13", "GPIO0_23"}, {"P8_14", "GPIO0_26"},
        {"P8_15", "GPIO1_15"}, {"P8_16", "GPIO1_14"}, {"P8_17", "GPIO0_27"},
        {"P8_18", "GPIO2_1"}, {"P8_19", "GPIO0_22"}, {"P8_20", "GPIO1_31"},
        {"P8_21", "GPIO1_30"}, {"P8_22", "GPIO1_5"}, {"P8_23", "GPIO1_4"},
        {"P8_24", "GPIO1_1"}, {"P8_25", "GPIO1_0"}, {"P8_26", "GPIO1_29"},
        {"P8_27", "GPIO2_22"}, {"P8_28", "GPIO2_24"}, {"P8_29", "GPIO2_23"},
        {"P8_30", "GPIO2_25"}, {"P8_31", "GPIO0_10"}, {"P8_32", "GPIO0_11"},
        {"P8_33", "GPIO0_9"}, {"P8_34", "GPIO2_17"}, {"P8_35", "GPIO0_8"},
        {"P8_36", "GPIO2_16"}, {"P8_37", "GPIO2_14"}, {"P8_38", "GPIO2_15"},
        {"P8_39", "GPIO2_12"}, {"P8_40", "GPIO2_13"}, {"P8_41", "GPIO2_10"},
        {"P8_42", "GPIO2_11"}, {"P8_43", "GPIO2_8"}, {"P8_44", "GPIO2_9"},
        {"P8_45", "GPIO2_6"}, {"P8_46", "GPIO2_7"}, {"P9_11", "GPIO0_30"},
        {"P9_12", "GPIO1_28"}, {"P9_13", "GPIO0_31"}, {"P9_14", "GPIO1_18"},
        {"P9_15", "GPIO1_16"}, {"P9_16", "GPIO1_19"}, {"P9_17", "GPIO0_5"},
        {"P9_18", "GPIO0_4"}, {"P9_19", "GPIO0_13"}, {"P9_20", "GPIO0_12"},
        {"P9_21", "GPIO0_3"}, {"P9_22", "GPIO0_2"}, {"P9_23", "GPIO1_17"},
        {"P9_24", "GPIO0_15"}, {"P9_25", "GPIO3_21"}, {"P9_26", "GPIO0_14"},
        {"P9_27", "GPIO3_19"}, {"P9_28", "GPIO3_17"}, {"P9_29", "GPIO3_15"},
        {"P9_30", "GPIO3_16"}, {"P9_31", "GPIO3_14"}, {"P9_41", "GPIO0_20"},
        {"P9_42", "GPIO3_20"}, {"P9_43", "GPIO0_7"}, {"P9_44", "GPIO3_18"},
        {"P9_33", "AIN4"}, {"P9_35", "AIN6"}, {"P9_36", "AIN5"}, {"P9_37", "AIN2"},
        {"P9_38", "AIN3"}, {"P9_39", "AIN0"}, {"P9_40", "AIN1"},
    };

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
        std::transform(c, pin.end(), info.name.begin(), [](auto c) { return std::toupper(c); });
        return info;
    }
}

PinResolver::PinResolver(const json& config)
{
    auto enumerations = config.at("enumerations");
    auto pin = enumerations.at("pin");
    for (auto& [name, value] : pin.items())
    {
        auto number_start = std::find_if(name.rbegin(), name.rend(), [](auto& c)
        {
            return c < '0' || c > '9';
        }).base();

        std::string base{name.begin(), number_start};
        std::transform(base.begin(), base.end(), base.begin(), [](auto c) { return std::toupper(c); });
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

    std::string mcu = config.at("config").at("MCU");
    auto mcu_pins = arduino_from_mcu.find(mcu);
    if (mcu_pins != arduino_from_mcu.end())
    {
        const auto& digital = std::get<0>(mcu_pins->second);
        for (int i=0; i<digital.size(); ++i)
        {
            char name[16];
            snprintf(name, sizeof(name), "AR%i", i);
            m_name_to_num[name] = getPin(digital[i]);
        }
        const auto& analog = std::get<1>(mcu_pins->second);
        for (int i=0; i<analog.size(); ++i)
        {
            char name[16];
            snprintf(name, sizeof(name), "ANALOG%i", i);
            m_name_to_num[name] = getPin(analog[i]);
        }
    }
    else if(mcu=="pru")
    {
        for (auto i: beaglebone_black)
        {
            auto pin = m_name_to_num.find(std::get<1>(i));
            if (pin != m_name_to_num.end())
            {
                m_name_to_num[std::get<0>(i)] = pin->second;
            }
        }
    }
}

unsigned PinResolver::getPin(const std::string& pin) const
{
    auto info = parsePin(pin);
    try
    {
        return m_name_to_num.at(info.name);
    }
    catch (std::out_of_range)
    {
        throw ParserError("Pin %s is not valid for the current MCU", pin.c_str());
    }
}

bool PinResolver::isInverted(const std::string& pin) const
{
    auto info = parsePin(pin);
    return info.isInverted;
}

bool PinResolver::hasPullUp(const std::string& pin) const
{
    auto info = parsePin(pin);
    return info.hasPullUp;
}

bool PinResolver::hasPullDown(const std::string& pin) const
{
    auto info = parsePin(pin);
    return info.hasPullDown;
}