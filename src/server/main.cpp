#include <iostream>
#include <string>
#include <cxxopts.hpp>
#include "parser.hpp"

int main(int argc, char* argv[])
{

    cxxopts::Options options("klipper_dash_visualizer", "Server for visualizing klipper serial output logs");
    options.add_options()
        ("h,help", "Print usage")
        ("d,dict", "Dictionary file to use", cxxopts::value<std::string>());
    ;
    try
    {
        auto result = options.parse(argc, argv);
        if (result.count("help"))
        {
            std::cout << options.help() << std::endl;
            exit(0);
        }
        
        auto parser = Parser(result["dict"].as<std::string>());
    }
    catch (cxxopts::OptionException e)
    {
        std::cout << e.what() << std::endl << std::endl;
        std::cout << options.help() << std::endl;
        return -1;
    }
    catch (ParserError e)
    {
        std::cout << "Error: " << e.what() << std::endl;
        return -1;
    }
    
}