module.exports = {
    presets: [
        [
            "@babel/preset-env",
            {
                // adds specific imports for polyfills when they are used in each file.
                useBuiltIns: "usage", 
                // preserve ES modules.
                modules: false, 
                // enable polyfilling of every proposal supported by core-js.
                corejs: { version: 3, proposals: true } 
            }
        ]
    ],
    plugins: [
        "@vue/babel-plugin-jsx",
        "@babel/plugin-transform-modules-commonjs",
        // enables the re-use of Babel's injected helper code to save on codesize.
        "@babel/plugin-transform-runtime"
    ],
    exclude: [/core-js/]
};