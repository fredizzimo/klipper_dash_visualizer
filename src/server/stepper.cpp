#include "stepper.hpp"
#include "config_parser.hpp"
#include "pin_resolver.hpp"

Stepper::Stepper(const std::string& name, const ConfigParser& config, const PinResolver& pinResolver)
{
    std::string step_pin_str = config.get<std::string>(name, "step_pin");
    unsigned step_pin = pinResolver.getPin(step_pin_str);
    bool inverted = pinResolver.isInverted(step_pin_str);
    uint32_t frequency = 1000;
    double step_size = 0.1;
    const double initial_position = 0.0;
    init(StepPin{step_pin}, Inverted{inverted}, Frequency{frequency}, StepSize{step_size}, InitialPosition{initial_position});
}

Stepper::Stepper(StepPin step_pin, Inverted inverted, Frequency frequency, StepSize step_size, InitialPosition initial_position)
{
    init(step_pin, inverted, frequency, step_size, initial_position);
}

void Stepper::init(StepPin step_pin, Inverted inverted, Frequency frequency, StepSize step_size, InitialPosition initial_position)
{
    m_step_pin = step_pin.value;
    m_inverted = inverted.value;
    m_period = 1.0 / frequency.value;
    m_step_size = step_size.value;
    m_initial_position = initial_position.value;
    m_times.push_back(0.0);
    m_positions.push_back(initial_position.value);
}

void Stepper::addSteps(uint32_t interval, uint32_t count, int32_t add)
{
    size_t new_size = m_positions.size() + count;
    m_positions.reserve(new_size);
    m_times.reserve(new_size);
    for (uint32_t i=0; i<count; i++)
    {
        m_current_time += interval;
        m_current_step_pos += 1;
        interval += add;

        m_times.push_back(m_current_time * m_period);
        m_positions.push_back(m_initial_position + m_current_step_pos * m_step_size);
    }
}