/*
 * DevForge AI – High Speed File Search
 * C++ CLI utility: search files by name pattern in a directory
 * Usage: ./file_search <directory> <pattern> [--type=f|d] [--ext=.php]
 * Compile: g++ -O2 -std=c++17 -o bin/file_search file_search.cpp
 */

#include <iostream>
#include <filesystem>
#include <string>
#include <vector>
#include <regex>
#include <algorithm>
#include <chrono>
#include <nlohmann/json.hpp>  // Optional: use simple JSON builder if unavailable

namespace fs = std::filesystem;

struct SearchResult {
    std::string path;
    std::string name;
    uintmax_t   size;
    bool        is_dir;
    std::string extension;
};

std::string toLower(std::string s) {
    std::transform(s.begin(), s.end(), s.begin(), ::tolower);
    return s;
}

int main(int argc, char* argv[]) {
    if (argc < 3) {
        std::cerr << "Usage: file_search <directory> <pattern> [--ext=.php] [--max=100]\n";
        return 1;
    }

    std::string directory = argv[1];
    std::string pattern   = toLower(argv[2]);
    std::string ext_filter;
    int max_results = 100;

    for (int i = 3; i < argc; ++i) {
        std::string arg = argv[i];
        if (arg.starts_with("--ext="))  ext_filter  = arg.substr(6);
        if (arg.starts_with("--max="))  max_results  = std::stoi(arg.substr(6));
    }

    if (!fs::exists(directory)) {
        std::cout << "{\"success\":false,\"error\":\"Directory not found\"}" << std::endl;
        return 1;
    }

    auto start = std::chrono::high_resolution_clock::now();
    std::vector<SearchResult> results;

    try {
        for (const auto& entry : fs::recursive_directory_iterator(
                directory,
                fs::directory_options::skip_permission_denied))
        {
            if ((int)results.size() >= max_results) break;

            auto name = entry.path().filename().string();
            auto nameLower = toLower(name);

            if (nameLower.find(pattern) == std::string::npos) continue;
            if (!ext_filter.empty() && entry.path().extension() != ext_filter) continue;

            SearchResult r;
            r.path      = entry.path().string();
            r.name      = name;
            r.is_dir    = entry.is_directory();
            r.size      = r.is_dir ? 0 : entry.file_size();
            r.extension = entry.path().extension().string();
            results.push_back(r);
        }
    } catch (const fs::filesystem_error&) {}

    auto end     = std::chrono::high_resolution_clock::now();
    auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count();

    // Output JSON
    std::cout << "{\"success\":true,\"count\":" << results.size()
              << ",\"time_ms\":" << elapsed
              << ",\"results\":[";

    for (size_t i = 0; i < results.size(); ++i) {
        const auto& r = results[i];
        std::string escaped_path = r.path;
        // Basic JSON escaping for backslashes
        std::string ep = "", en = "";
        for (char c : r.path)  { if (c == '\\') ep += "\\\\"; else if (c == '"') ep += "\\\""; else ep += c; }
        for (char c : r.name)  { if (c == '"') en += "\\\""; else en += c; }

        std::cout << "{\"path\":\"" << ep << "\","
                  << "\"name\":\"" << en << "\","
                  << "\"size\":"   << r.size << ","
                  << "\"is_dir\":" << (r.is_dir ? "true" : "false") << ","
                  << "\"ext\":\""  << r.extension << "\"}";
        if (i + 1 < results.size()) std::cout << ",";
    }

    std::cout << "]}" << std::endl;
    return 0;
}
