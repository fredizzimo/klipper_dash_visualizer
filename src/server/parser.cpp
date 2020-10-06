#include "parser.hpp"
#include <zlib.h>
#include <vector>
#include <nlohmann/json.hpp>

#include <iostream>

using json = nlohmann::json;

Parser::Parser(const std::string& dictionary)
    :  m_dictionary(dictionary)
{
    auto dict = gzopen(dictionary.c_str(), "rb");
    if (dict)
    {
        std::vector<char> buffer;

        while (true)
        {
            const size_t pos = buffer.size();
            buffer.resize(buffer.size() + 4096);
            int read = gzread(dict, &buffer.front() + pos, 4096);
            if (read < 4096)
            {
                gzclose(dict);
                if (read >= 0)
                {
                    buffer.resize(pos + read);
                }
                else if (read == -1)
                {
                    throw ParserError("Failed to decompress. The dictionary file %s appears to be corrupted", dictionary.c_str());
                }
                break;
            }
        }
        
        try
        {
            auto j = json::parse(buffer.begin(), buffer.end());
            std::cout << j.dump(4);
        }
        catch (json::exception e)
        {
            throw ParserError("Failed to load json. The dictionary file %s appears to be corrupted", dictionary.c_str());
        }
    }
    else
    {
        throw ParserError("Could not open dictionary file %s", dictionary.c_str());
    }
}