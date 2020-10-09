cmake_minimum_required(VERSION 3.10)

configure_file(CMakeLists.txt.in external/inih/CMakeLists.txt)
execute_process(COMMAND ${CMAKE_COMMAND} -G "${CMAKE_GENERATOR}" .
  RESULT_VARIABLE result
  WORKING_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}/external/inih)
if(result)
  message(FATAL_ERROR "CMake step for inih failed: ${result}")
endif()
execute_process(COMMAND ${CMAKE_COMMAND} --build .
  RESULT_VARIABLE result
  WORKING_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}/external/inih)
if(result)
  message(FATAL_ERROR "Build step for inih failed: ${result}")
endif()

add_library(inih STATIC)
target_sources(inih PRIVATE
  ${CMAKE_CURRENT_BINARY_DIR}/inih-src/ini.c
)
target_include_directories(inih PUBLIC
  ${CMAKE_CURRENT_BINARY_DIR}/inih-src
)
target_compile_definitions(inih PUBLIC INI_CALL_HANDLER_ON_NEW_SECTION=1)