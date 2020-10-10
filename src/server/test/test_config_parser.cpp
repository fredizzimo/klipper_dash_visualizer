#include "gtest/gtest.h"
#include "gmock/gmock.h"
#include "config_parser.hpp"

using testing::_;

namespace
{
    using Callback = std::function<void (const char* buffer)>;
    class MockFileReader : public ConfigParser::IFileReader
    {
    public:
        MOCK_METHOD(void, readFile, (const std::string& filename, const std::string& parent_filename, Callback callback), (override));
    };
}

TEST(ConfigParser, EmptyConfig)
{
    MockFileReader fileReader;
    EXPECT_CALL(fileReader, readFile("afile.ini", "", _))
        .WillOnce([](const std::string& filename, const std::string& parent_filename, Callback callback)
        {
            callback("");
        });
    ConfigParser parser("afile.ini", fileReader);
    EXPECT_FALSE(parser.hasValue("a section", "avalue"));
}

TEST(ConfigParser, SimpleConfig)
{
auto config = R"(
{
[a section]
avalue=myvalue
space value = does this work?
anint = 5
adouble = 7.0

[UPPERCASE SECTION]
CamelCaseValue = Hello World

#[commented section]
#commentedvalue=Not found

)";
    MockFileReader fileReader;
    EXPECT_CALL(fileReader, readFile("afile.ini", "", _))
        .WillOnce([config](const std::string& filename, const std::string& parent_filename, Callback callback)
        {
            callback(config);
        });
    ConfigParser parser("afile.ini", fileReader);
    EXPECT_TRUE(parser.hasValue("a section", "avalue"));
    EXPECT_EQ("myvalue", parser.get<std::string>("a section", "avalue"));

    EXPECT_TRUE(parser.hasValue("a section", "space value"));
    EXPECT_EQ("does this work?", parser.get<std::string>("a section", "space value"));

    EXPECT_TRUE(parser.hasValue("a section", "anint"));
    EXPECT_EQ(5, parser.get<int>("a section", "anint"));

    EXPECT_TRUE(parser.hasValue("uppercase section", "camelcasevalue"));
    EXPECT_EQ("Hello World", parser.get<std::string>("uppercase section", "camelcasevalue"));

    EXPECT_FALSE(parser.hasValue("commented section", "commentedvalue"));
}

TEST(ConfigParser, IncludeConfig)
{
auto config = R"(
{
[first]
avalue=myvalue

[include Path/to/Config2.ini]

[after]
hello=world
)";

auto config2 = R"(
{
[second]
avalue=myvalue2
)";
    MockFileReader fileReader;
    EXPECT_CALL(fileReader, readFile("afile.ini", "", _))
        .WillOnce([config](const std::string& filename, const std::string& parent_filename, Callback callback)
        {
            callback(config);
        });
    EXPECT_CALL(fileReader, readFile("Path/to/Config2.ini", "afile.ini", _))
        .WillOnce([config2](const std::string& filename, const std::string& parent_filename, Callback callback)
        {
            callback(config2);
        });
    ConfigParser parser("afile.ini", fileReader);
    EXPECT_TRUE(parser.hasValue("first", "avalue"));
    EXPECT_EQ("myvalue", parser.get<std::string>("first", "avalue"));

    EXPECT_TRUE(parser.hasValue("second", "avalue"));
    EXPECT_EQ("myvalue2", parser.get<std::string>("second", "avalue"));

    EXPECT_TRUE(parser.hasValue("after", "hello"));
    EXPECT_EQ("world", parser.get<std::string>("after", "hello"));
}