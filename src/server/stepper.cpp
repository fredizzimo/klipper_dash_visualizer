#include "stepper.hpp"
#include "config_parser.hpp"
#include "pin_resolver.hpp"

Stepper::Stepper(const std::string& name, const ConfigParser& config, const PinResolver& pinResolver)
{
    std::string step_pin_str = config.get<std::string>(name, "step_pin");
    m_step_pin = pinResolver.getPin(step_pin_str);
    m_inverted = pinResolver.isInverted(step_pin_str);
}