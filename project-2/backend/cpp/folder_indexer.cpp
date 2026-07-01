/*
 * DevForge AI – Folder Indexer
 * C++ CLI: Recursively index a folder and output JSON file tree
 * Usage: ./folder_indexer <directory> [--depth=5] [--max=500]
 * Compile: g++ -O2 -std=c++17 -o bin/folder_indexer folder_indexer.cpp
 */

#include <iostream>
#include <filesystem>
#include <string>
#include <vector>
#include <chrono>
#include <algorithm>

namespace fs = std::filesystem;

struct FileNode
{
    std::string name;
    std::string path;
    bool is_dir;
    uintmax_t size;
    std::string ext;
    int depth;
};

std::string escJ(const std::string &s)
{
    std::string r;
    for (char c : s)
    {
        if (c == '\\')
            r += "\\\\";
        else if (c == '"')
            r += "\\\"";
        else if (c == '\n')
            r += "\\n";
        else
            r += c;
    }
    return r;
}

int main(int argc, char *argv[])
{
    if (argc < 2)
    {
        std::cerr << "Usage: folder_indexer <directory> [--depth=5] [--max=500]\n";
        return 1;
    }

    std::string directory = argv[1];
    int max_depth = 5;
    int max_files = 500;
    uintmax_t total_size = 0;
    int dir_count = 0;
    int file_count = 0;

    for (int i = 2; i < argc; ++i)
    {
        std::string arg = argv[i];

        // C++17 Fallback for "--depth="
        if (arg.length() >= 8 && arg.substr(0, 8) == "--depth=")
        {
            max_depth = std::stoi(arg.substr(8));
        }

        // C++17 Fallback for "--max="
        if (arg.length() >= 6 && arg.substr(0, 6) == "--max=")
        {
            max_files = std::stoi(arg.substr(6));
        }
    }

    if (!fs::exists(directory))
    {
        std::cout << "{\"success\":false,\"error\":\"Directory not found\"}" << std::endl;
        return 1;
    }

    auto start = std::chrono::high_resolution_clock::now();
    std::vector<FileNode> nodes;

    try
    {
        for (const auto &entry : fs::recursive_directory_iterator(
                 directory,
                 fs::directory_options::skip_permission_denied))
        {
            if ((int)nodes.size() >= max_files)
                break;

            // Compute depth relative to base
            auto rel_path = fs::relative(entry.path(), directory);
            int depth = 0;
            for (const auto &part : rel_path)
                ++depth;
            if (depth > max_depth)
                continue;

            FileNode n;
            n.name = entry.path().filename().string();
            n.path = fs::relative(entry.path(), directory).string();
            n.is_dir = entry.is_directory();
            n.depth = depth;
            n.ext = entry.path().extension().string();

            if (!n.is_dir)
            {
                n.size = entry.file_size();
                total_size += n.size;
                ++file_count;
            }
            else
            {
                n.size = 0;
                ++dir_count;
            }

            nodes.push_back(n);
        }
    }
    catch (const fs::filesystem_error &)
    {
    }

    auto end = std::chrono::high_resolution_clock::now();
    auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count();

    std::cout << "{\"success\":true,"
              << "\"directory\":\"" << escJ(directory) << "\","
              << "\"file_count\":" << file_count << ","
              << "\"dir_count\":" << dir_count << ","
              << "\"total_size\":" << total_size << ","
              << "\"time_ms\":" << elapsed << ","
              << "\"nodes\":[";

    for (size_t i = 0; i < nodes.size(); ++i)
    {
        const auto &n = nodes[i];
        std::cout << "{\"name\":\"" << escJ(n.name) << "\","
                  << "\"path\":\"" << escJ(n.path) << "\","
                  << "\"is_dir\":" << (n.is_dir ? "true" : "false") << ","
                  << "\"size\":" << n.size << ","
                  << "\"depth\":" << n.depth << ","
                  << "\"ext\":\"" << escJ(n.ext) << "\"}";
        if (i + 1 < nodes.size())
            std::cout << ",";
    }

    std::cout << "]}" << std::endl;
    return 0;
}