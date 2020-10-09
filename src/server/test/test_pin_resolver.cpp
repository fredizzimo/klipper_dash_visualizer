#include "gtest/gtest.h"
#include "pin_resolver.hpp"
#include <nlohmann/json.hpp>

using json = nlohmann::json;

TEST(PinResolver, BasicTests)
{
    auto config = R"(
    {
        "config": {
            "MCU": ""
        },
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
        "config": {
            "MCU": ""
        },
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
        "config": {
            "MCU": ""
        },
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
        "config": {
            "MCU": ""
        },
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

TEST(PinResolver, Arduino)
{
    auto config = R"(
    {
        "config": {
            "MCU": "atmega2560"
        },
        "enumerations": {
            "pin": {
                "PA0": [
                    0,
                    8
                ],
                "PB0": [
                    8,
                    8
                ],
                "PC0": [
                    16,
                    8
                ],
                "PD0": [
                    24,
                    8
                ],
                "PE0": [
                    32,
                    8
                ],
                "PF0": [
                    40,
                    8
                ],
                "PG0": [
                    48,
                    8
                ],
                "PH0": [
                    56,
                    8
                ],
                "PJ0": [
                    72,
                    8
                ],
                "PK0": [
                    80,
                    8
                ],
                "PL0": [
                    88,
                    8
                ]
            }
        }
    }
    )"_json;
    PinResolver resolver(config);

    EXPECT_EQ(0, resolver.getPin("PA0"));
    EXPECT_EQ(32, resolver.getPin("ar0"));
    EXPECT_EQ(20, resolver.getPin("ar33"));
    EXPECT_EQ(40, resolver.getPin("analog0"));
}

TEST(PinResolver, Beaglebone)
{
    auto config = R"(
    {
        "config": {
            "MCU": "pru"
        },
        "enumerations": {
            "pin":{
                "gpio0_0":[
                    0,
                    32
                ],
                "gpio1_0":[
                    32,
                    32
                ],
                "gpio2_0":[
                    64,
                    32
                ],
                "gpio3_0":[
                    96,
                    32
                ],
                "AIN0": [
                    128,
                    8
                ]
            }
        }
    }
    )"_json;
    PinResolver resolver(config);

    EXPECT_EQ(0, resolver.getPin("gpio0_0"));
    EXPECT_EQ(5, resolver.getPin("gpio0_5"));
    EXPECT_EQ(65, resolver.getPin("gpio2_1"));
    EXPECT_EQ(38, resolver.getPin("P8_3"));
    EXPECT_EQ(132, resolver.getPin("P9_33"));
}

TEST(PinResolver, BeagleboneMissingAnalog)
{
    auto config = R"(
    {
        "config": {
            "MCU": "pru"
        },
        "enumerations": {
            "pin":{
                "gpio0_0":[
                    0,
                    32
                ],
                "gpio1_0":[
                    32,
                    32
                ],
                "gpio2_0":[
                    64,
                    32
                ],
                "gpio3_0":[
                    96,
                    32
                ]
            }
        }
    }
    )"_json;
    PinResolver resolver(config);

    EXPECT_EQ(0, resolver.getPin("gpio0_0"));
    EXPECT_EQ(38, resolver.getPin("P8_3"));
}