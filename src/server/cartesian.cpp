#include "cartesian.hpp"
#include <stdexcept>

Cartesian::Cartesian(const ConfigParser& config, const PinResolver& pinResolver)
    : m_stepper_x("stepper_x", config, pinResolver)
    , m_stepper_y("stepper_y", config, pinResolver)
    , m_stepper_z("stepper_z", config, pinResolver)
{
}

size_t Cartesian::getNumSteppers()
{
    return 3;
}

Stepper& Cartesian::getStepper(size_t num)
{
    switch(num)
    {
        case 0:
            return m_stepper_x;
        case 1:
            return m_stepper_y;
        case 2:
            return m_stepper_z;
    }
    throw std::runtime_error("invalid stepper index");
}