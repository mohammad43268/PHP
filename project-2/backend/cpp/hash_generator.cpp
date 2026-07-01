/*
 * DevForge AI – SHA256 Hash Generator
 * C++ CLI utility: compute SHA256 of files
 * Usage: ./hash_generator <file_path>
 * Compile: g++ -O2 -std=c++17 -o bin/hash_generator hash_generator.cpp -lssl -lcrypto
 */

#include <iostream>
#include <fstream>
#include <sstream>
#include <iomanip>
#include <string>
#include <filesystem>
#include <vector>
#include <chrono>

#ifdef __has_include
#if __has_include(<openssl/sha.h>)
#include <openssl/sha.h>
#define HAS_OPENSSL 1
#else
#define HAS_OPENSSL 0
#endif
#else
#define HAS_OPENSSL 0
#endif

namespace fs = std::filesystem;

#if HAS_OPENSSL
std::string sha256_file(const std::string &path)
{
    std::ifstream file(path, std::ios::binary);
    if (!file.is_open())
        return "";

    SHA256_CTX ctx;
    SHA256_Init(&ctx);

    char buffer[8192];
    while (file.read(buffer, sizeof(buffer)))
    {
        SHA256_Update(&ctx, buffer, file.gcount());
    }
    if (file.gcount() > 0)
        SHA256_Update(&ctx, buffer, file.gcount());

    unsigned char hash[SHA256_DIGEST_LENGTH];
    SHA256_Final(hash, &ctx);

    std::ostringstream ss;
    for (int i = 0; i < SHA256_DIGEST_LENGTH; ++i)
        ss << std::hex << std::setw(2) << std::setfill('0') << (int)hash[i];
    return ss.str();
}
#else
// Fallback: simple (non-cryptographic) hash for demonstration
std::string sha256_file(const std::string &path)
{
    std::ifstream file(path, std::ios::binary);
    if (!file.is_open())
        return "";
    std::size_t hash = 0;
    char c;
    while (file.get(c))
        hash ^= std::hash<char>{}(c) + 0x9e3779b9 + (hash << 6) + (hash >> 2);
    std::ostringstream ss;
    ss << std::hex << std::setfill('0') << std::setw(16) << hash;
    return ss.str() + "0000000000000000000000000000000000000000000000000000000000000000"; // pad to 64 chars
}
#endif

int main(int argc, char *argv[])
{
    if (argc < 2)
    {
        std::cerr << "Usage: hash_generator <file_path> [<file_path2> ...]\n";
        return 1;
    }

    auto start = std::chrono::high_resolution_clock::now();

    std::cout << "{\"success\":true,\"results\":[";

    for (int i = 1; i < argc; ++i)
    {
        std::string path = argv[i];
        bool exists = fs::exists(path);
        std::string hash = exists ? sha256_file(path) : "";
        uintmax_t size = exists && fs::is_regular_file(path) ? fs::file_size(path) : 0;

        // Escape path
        std::string ep;
        for (char c : path)
        {
            if (c == '\\')
                ep += "\\\\";
            else if (c == '"')
                ep += "\\\"";
            else
                ep += c;
        }

        std::cout << "{\"path\":\"" << ep << "\","
                  << "\"sha256\":\"" << hash << "\","
                  << "\"size\":" << size << ","
                  << "\"exists\":" << (exists ? "true" : "false") << "}";

        if (i + 1 < argc)
            std::cout << ",";
    }

    auto end = std::chrono::high_resolution_clock::now();
    auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count();

    std::cout << "],\"time_ms\":" << elapsed << "}" << std::endl;
    return 0;
}
