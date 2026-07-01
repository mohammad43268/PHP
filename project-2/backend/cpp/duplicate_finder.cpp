/*
 * DevForge AI – Duplicate File Finder
 * C++ CLI: Find duplicate files by SHA256 hash
 * Usage: ./duplicate_finder <directory>
 * Compile: g++ -O2 -std=c++17 -o bin/duplicate_finder duplicate_finder.cpp
 */

#include <iostream>
#include <filesystem>
#include <fstream>
#include <string>
#include <vector>
#include <unordered_map>
#include <chrono>
#include <sstream>
#include <iomanip>

namespace fs = std::filesystem;

// Simple djb2 file hash (fast, not cryptographic)
std::string file_hash(const std::string& path) {
    std::ifstream f(path, std::ios::binary);
    if (!f.is_open()) return "";

    unsigned long long hash = 5381;
    char c;
    while (f.get(c)) {
        hash = ((hash << 5) + hash) + (unsigned char)c;
    }

    std::ostringstream ss;
    ss << std::hex << std::setfill('0') << std::setw(16) << hash;
    return ss.str();
}

std::string escJ(const std::string& s) {
    std::string r;
    for (char c : s) {
        if (c == '\\') r += "\\\\";
        else if (c == '"') r += "\\\"";
        else r += c;
    }
    return r;
}

int main(int argc, char* argv[]) {
    if (argc < 2) {
        std::cerr << "Usage: duplicate_finder <directory> [--max=200]\n";
        return 1;
    }

    std::string directory = argv[1];
    int max_files = 200;
    for (int i = 2; i < argc; ++i) {
        std::string arg = argv[i];
        if (arg.starts_with("--max=")) max_files = std::stoi(arg.substr(6));
    }

    if (!fs::exists(directory)) {
        std::cout << "{\"success\":false,\"error\":\"Directory not found\"}" << std::endl;
        return 1;
    }

    auto start = std::chrono::high_resolution_clock::now();

    // Map: hash -> list of paths
    std::unordered_map<std::string, std::vector<std::string>> hash_map;
    int processed = 0;

    try {
        for (const auto& entry : fs::recursive_directory_iterator(
                directory, fs::directory_options::skip_permission_denied))
        {
            if (processed >= max_files) break;
            if (!entry.is_regular_file()) continue;
            if (entry.file_size() == 0) continue;

            std::string path = entry.path().string();
            std::string hash = file_hash(path);
            if (!hash.empty()) {
                hash_map[hash].push_back(path);
            }
            ++processed;
        }
    } catch (const fs::filesystem_error&) {}

    auto end     = std::chrono::high_resolution_clock::now();
    auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count();

    // Collect duplicates
    std::vector<std::pair<std::string, std::vector<std::string>>> duplicates;
    for (const auto& [hash, paths] : hash_map) {
        if (paths.size() > 1) {
            duplicates.push_back({hash, paths});
        }
    }

    std::cout << "{\"success\":true,"
              << "\"processed\":" << processed << ","
              << "\"duplicate_groups\":" << duplicates.size() << ","
              << "\"time_ms\":" << elapsed << ","
              << "\"groups\":[";

    for (size_t i = 0; i < duplicates.size(); ++i) {
        const auto& [hash, paths] = duplicates[i];
        uintmax_t size = 0;
        try { size = fs::file_size(paths[0]); } catch (...) {}

        std::cout << "{\"hash\":\"" << hash << "\",\"size\":" << size << ",\"files\":[";
        for (size_t j = 0; j < paths.size(); ++j) {
            std::cout << "\"" << escJ(paths[j]) << "\"";
            if (j + 1 < paths.size()) std::cout << ",";
        }
        std::cout << "]}";
        if (i + 1 < duplicates.size()) std::cout << ",";
    }

    std::cout << "]}" << std::endl;
    return 0;
}
