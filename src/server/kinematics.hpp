#pragma once
#include <cstddef>

class Stepper;

class Kinematics
{
public:
    virtual ~Kinematics() {}
    virtual size_t getNumSteppers() = 0;
    virtual Stepper& getStepper(size_t num) = 0;
};