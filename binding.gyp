{
  "targets": [
    {
      "target_name": "xifty_node",
      "sources": [ "src/addon.cc" ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "<!@(node scripts/print_xifty_paths.js include)"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "libraries": [
        "<!@(node scripts/print_xifty_paths.js staticlib)"
      ],
      "defines": [ "NAPI_CPP_EXCEPTIONS" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "conditions": [
        [
          "OS==\"win\"",
          {
            "libraries": [
              "Ws2_32.lib",
              "Userenv.lib",
              "Ntdll.lib"
            ],
            "msvs_settings": {
              "VCCLCompilerTool": {
                "ExceptionHandling": 1
              }
            }
          }
        ]
      ],
      "xcode_settings": {
        "GCC_ENABLE_CPP_EXCEPTIONS": "YES"
      }
    }
  ]
}
