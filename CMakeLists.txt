cmake_minimum_required(VERSION 3.10)

project(klipper_dash_visualizer VERSION 0.1)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED True)

add_executable(klipper_dash_visualizer src/server/main.cpp)
target_sources(klipper_dash_visualizer PRIVATE src/server/parser.cpp)

find_package(cxxopts 2.2.0 REQUIRED)
find_package(nlohmann_json 3.9.0 REQUIRED)
find_package(ZLIB 1.2.0 REQUIRED)

target_link_libraries(klipper_dash_visualizer PRIVATE nlohmann_json::nlohmann_json)
target_link_libraries(klipper_dash_visualizer PRIVATE ZLIB::ZLIB)