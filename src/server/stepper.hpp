#pragma once
#include <string>

class ConfigParser;
class PinResolver;

class Stepper
{
public:
    Stepper(const std::string& name, const ConfigParser& config, const PinResolver& pinResolver);
    unsigned getPin() const { return m_step_pin; }
private:
    unsigned m_step_pin;
    bool m_inverted;
};