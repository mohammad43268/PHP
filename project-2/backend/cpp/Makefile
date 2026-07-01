# DevForge AI – C++ Build System
# Compile all C++ utilities to bin/
# Run: make all  (or: make file_search)
# Requires: g++ with C++17 support

CXX      = g++
CXXFLAGS = -O2 -std=c++17 -Wall -Wextra
BINDIR   = bin

# Conditionally link OpenSSL for hash_generator
OPENSSL_FLAGS = -lssl -lcrypto

TARGETS = \
    $(BINDIR)/file_search \
    $(BINDIR)/hash_generator \
    $(BINDIR)/folder_indexer \
    $(BINDIR)/duplicate_finder

.PHONY: all clean setup

all: setup $(TARGETS)
	@echo "✅ All DevForge AI C++ modules compiled!"
	@ls -lh $(BINDIR)/

setup:
	@mkdir -p $(BINDIR)

$(BINDIR)/file_search: file_search.cpp
	$(CXX) $(CXXFLAGS) -o $@ $<
	@echo "✓ file_search compiled"

$(BINDIR)/hash_generator: hash_generator.cpp
	$(CXX) $(CXXFLAGS) -o $@ $< $(OPENSSL_FLAGS) || $(CXX) $(CXXFLAGS) -o $@ $<
	@echo "✓ hash_generator compiled"

$(BINDIR)/folder_indexer: folder_indexer.cpp
	$(CXX) $(CXXFLAGS) -o $@ $<
	@echo "✓ folder_indexer compiled"

$(BINDIR)/duplicate_finder: duplicate_finder.cpp
	$(CXX) $(CXXFLAGS) -o $@ $< $(OPENSSL_FLAGS) || $(CXX) $(CXXFLAGS) -o $@ $<
	@echo "✓ duplicate_finder compiled"

clean:
	rm -rf $(BINDIR)
	@echo "Cleaned binaries"

test:
	@echo "Testing file_search..."
	@./$(BINDIR)/file_search . "cpp" --max=5
	@echo "Testing folder_indexer..."
	@./$(BINDIR)/folder_indexer . --depth=2 --max=10
