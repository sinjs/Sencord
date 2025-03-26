#include <iostream>
#include <Windows.h>

typedef int (*FuncType)(char *);

int main(int argc, char* argv[]) {
    if (argc < 3) {
        return 1;
    }

    std::string dll_path = argv[1];
    std::string function_name = argv[2];
    char* arg1 = argv[3];

    HMODULE module_handle = LoadLibraryA(dll_path.c_str());
    if (!module_handle) {
        std::cerr << "Failed to load DLL: " << dll_path << std::endl;
        return 1;
    }

    FuncType func = (FuncType)GetProcAddress(module_handle, function_name.c_str());
    if (!func) {
        std::cerr << "Failed to find function: " << function_name << std::endl;
        FreeLibrary(module_handle);
        return 1;
    }

    int result = func(arg1);
    std::cout << result << std::endl;

    FreeLibrary(module_handle);
    return 0;
}
