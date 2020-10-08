#include "gtest/gtest.h"
#include "pin_resolver.hpp"
#include <nlohmann/json.hpp>

using json = nlohmann::json;

TEST(PinResolver, BasicTests)
{
    auto config = R"(
    {
        "enumerations": {
            "pin": {
                "PA0": [
                    10,
                    8
                ],
                "PB3": [
                    27,
                    5
                ],
                "PB0": [
                    21,
                    2
                ]
            }
        }
    }
    )"_json;
    PinResolver resolver(config);

    EXPECT_EQ(10, resolver.getPin("PA0"));
    EXPECT_EQ(11, resolver.getPin("PA1"));
    EXPECT_EQ(17, resolver.getPin("PA7"));
    EXPECT_EQ(27, resolver.getPin("PB3"));
    EXPECT_EQ(28, resolver.getPin("PB4"));
    EXPECT_EQ(31, resolver.getPin("PB7"));
    EXPECT_EQ(21, resolver.getPin("PB0"));
    EXPECT_EQ(22, resolver.getPin("PB1"));
}

TEST(PinResolver, PinOptions)
{
    auto config = R"(
    {
        "enumerations": {
            "pin": {}
        }
    }
    )"_json;
    PinResolver resolver(config);

    EXPECT_FALSE(resolver.isInverted("PA0"));
    EXPECT_TRUE(resolver.isInverted("!PA0"));
    EXPECT_FALSE(resolver.hasPullUp("PA0"));
    EXPECT_TRUE(resolver.hasPullUp("^PA0"));
    EXPECT_FALSE(resolver.hasPullDown("PA0"));
    EXPECT_TRUE(resolver.hasPullDown("~PA0"));

    EXPECT_TRUE(resolver.isInverted("!^PA0"));
    EXPECT_TRUE(resolver.isInverted("^!PA0"));
    EXPECT_TRUE(resolver.hasPullUp("!^PA0"));
    EXPECT_TRUE(resolver.hasPullUp("^!PA0"));
    EXPECT_TRUE(resolver.hasPullDown("!~PA0"));
    EXPECT_TRUE(resolver.hasPullDown("~!PA0"));
}

TEST(PinResolver, GetWithOptions)
{

    auto config = R"(
    {
        "enumerations": {
            "pin": {
                "PA0": [
                    10,
                    8
                ]
            }
        }
    }
    )"_json;
    PinResolver resolver(config);

    EXPECT_EQ(10, resolver.getPin("!PA0"));
    EXPECT_EQ(11, resolver.getPin("!^PA1"));
}

TEST(PinResolver, NoCaseSenitivity)
{

    auto config = R"(
    {
        "enumerations": {
            "pin": {
                "PA0": [
                    10,
                    8
                ]
            }
        }
    }
    )"_json;
    PinResolver resolver(config);

    EXPECT_EQ(10, resolver.getPin("pa0"));
    EXPECT_EQ(10, resolver.getPin("Pa0"));
    EXPECT_EQ(10, resolver.getPin("pA0"));
}