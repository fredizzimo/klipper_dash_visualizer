#include "gtest/gtest.h"
#include "gmock/gmock.h"
#include "stepper.hpp"

using testing::ElementsAre;

using StepPin = Stepper::StepPin;
using Inverted = Stepper::Inverted;
using Frequency = Stepper::Frequency;
using StepSize = Stepper::StepSize;
using InitialPosition = Stepper::InitialPosition;

TEST(Stepper, InitializedWithOneStep)
{
   Stepper stepper(StepPin{0}, Inverted{false}, Frequency{1000}, StepSize{0.1}, InitialPosition{5.0});
   ASSERT_THAT(stepper.getTimes(), ElementsAre(0.0));
   ASSERT_THAT(stepper.getPositions(), ElementsAre(5.0));
}

TEST(Stepper, StepOneForward)
{
   Stepper stepper(StepPin{0}, Inverted{false}, Frequency{1000}, StepSize{0.1}, InitialPosition{5.0});
   stepper.addSteps(1000, 1, 0);
   ASSERT_THAT(stepper.getTimes(), ElementsAre(0.0, 1.0));
   ASSERT_THAT(stepper.getPositions(), ElementsAre(5.0, 5.1));
}

TEST(Stepper, StepWithAdd)
{
   Stepper stepper(StepPin{0}, Inverted{false}, Frequency{1000}, StepSize{0.3}, InitialPosition{2.0});
   stepper.addSteps(200, 3, 100);
   ASSERT_THAT(stepper.getTimes(), ElementsAre(0.0, 0.2, 0.5, 0.9));
   ASSERT_THAT(stepper.getPositions(), ElementsAre(2.0, 2.3, 2.6, 2.9));
}

TEST(Stepper, StepWithNegativeAdd)
{
   Stepper stepper(StepPin{0}, Inverted{false}, Frequency{10000}, StepSize{0.1}, InitialPosition{2.0});
   stepper.addSteps(3000, 3, -1000);
   ASSERT_THAT(stepper.getTimes(), ElementsAre(0.0, 0.3, 0.5, 0.6));
   ASSERT_THAT(stepper.getPositions(), ElementsAre(2.0, 2.1, 2.2, 2.3));
}