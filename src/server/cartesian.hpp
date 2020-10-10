#pragma once
#include "kinematics.hpp"
#include "stepper.hpp"

class ConfigParser;
class PinResolver;

class Cartesian : public Kinematics
{
public:
    Cartesian(const ConfigParser& config, const PinResolver& pinResolver);
    size_t getNumSteppers();
    Stepper& getStepper(size_t num);
private:
    Stepper m_stepper_x;
    Stepper m_stepper_y;
    Stepper m_stepper_z;
};