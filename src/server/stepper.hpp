#pragma once
#include <string>
#include <vector>
#include "named_type.hpp"

class ConfigParser;
class PinResolver;

class Stepper
{
public:
    using StepPin = NamedType<unsigned, struct StepPin_t>;
    using Inverted = NamedType<bool, struct Inverted_t>;
    using Frequency = NamedType<uint32_t, struct Frequency_t>;
    using StepSize = NamedType<double, struct StepSize_t>;
    using InitialPosition = NamedType<double, struct InitialPosition_t>;

    Stepper(const std::string& name, const ConfigParser& config, const PinResolver& pinResolver);
    Stepper(StepPin step_pin, Inverted inverted, Frequency frequency, StepSize step_size, InitialPosition initial_position);
    unsigned getPin() const { return m_step_pin; }

    void addSteps(uint32_t interval, uint32_t count, int32_t add);

    const std::vector<double>& getTimes() const {return m_times; };
    const std::vector<double>& getPositions() const {return m_positions; };
private:
    void init(StepPin step_pin, Inverted inverted, Frequency frequency, StepSize step_size, InitialPosition initial_position);
    unsigned m_step_pin;
    bool m_inverted;
    double m_period;
    double m_step_size;
    double m_initial_position;

    uint64_t m_current_time = 0;
    int64_t m_current_step_pos = 0;
    std::vector<double> m_times;
    std::vector<double> m_positions;
};