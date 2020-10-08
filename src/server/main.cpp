#include <iostream>
#include <string>
#include "config.h"
#include <argparse/argparse.hpp>
#include "parser.hpp"

int main(int argc, char* argv[])
{
    argparse::ArgumentParser argParser(PROJECT_NAME);
    argParser.add_argument("-d", "--dict")
        .required()
        .help("Path to the dictionary file")
    ;
    argParser.add_argument("input")
        .required()
        .help("Path to the input serial port dump file")
    ;

    try
    {
        argParser.parse_args(argc, argv);
        std::string dictFile = argParser.get<std::string>("--dict");
        std::string serialFile = argParser.get<std::string>("input");
        auto parser = Parser(dictFile);
        parser.parse(serialFile);
    }
    catch (ParserError e)
    {
        std::cout << "Error: " << e.what() << std::endl;
        return -1;
    }
    catch(std::runtime_error& err)
    {
        std::cout << err.what();
        std::cout << argParser;
        return -1;
    }
}