const { CleanWebpackPlugin, DefinePlugin } = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const PrettierPlugin = require("prettier-webpack-plugin");
const ESLintPlugin = require("eslint-webpack-plugin");
const { VueLoaderPlugin } = require("vue-loader");
const config = require("../project.config");

module.exports = {
    // Where webpack looks to start building the bundle
    entry: {
        app: "./src/main.ts"
    },

    // Where webpack outputs the assets and bundles
    output: {
        path: paths.resolve(config.outputDir),
        publicPath: config.dev.publicPath,
        filename: outputFileName,
        chunkFilename: outputFileName
    },

    resolve: {
        alias: {
            "@": config.src
        },
        extensions: [".ts", ".tsx", ".js", ".jsx", ".vue", ".json"]
    },

    // Customize the webpack build process
    plugins: [
    // Removes/cleans build folders and unused assets when rebuilding
        new CleanWebpackPlugin(),

        new VueLoaderPlugin(),
       

        // Copies files from target to destination folder
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: paths.public,
                    to: "assets",
                    globOptions: {
                        ignore: ["*.DS_Store"]
                    },
                    noErrorOnMissing: true
                }
            ]
        }),

        // Generates an HTML file from a template
        // Generates deprecation warning: https://github.com/jantimon/html-webpack-plugin/issues/1501
        new HtmlWebpackPlugin({
            title: "webpack",
            template: paths.resolve("public/index.html"), 
            filename: "index.html" // output file
        }),

        // ESLint configuration
        new ESLintPlugin({
            files: [".", "src", "config"],
            formatter: "table"
        }),

        // Prettier configuration
        new PrettierPlugin(),
        new DefinePlugin({
            // vue3 feature flags <http://link.vuejs.org/feature-flags>
            __VUE_OPTIONS_API__: "true",
            __VUE_PROD_DEVTOOLS__: "false",

            ...resolveClientEnv({ publicPath: config.dev.publicPath })
        })
    ],

    // Determine how modules within the project are treated
    module: {
        noParse: /^(vue|vue-router|vuex|vuex-router-sync)$/,

        rules: [
            {
                test: /\.vue$/,
                loader: "vue-loader"
            },

            // babel
            {
                test: /\.m?jsx?$/,
                exclude: (file) => 
                {
                    // always transpile js in vue files
                    if (/\.vue\.jsx?$/.test(file)) 
                    {
                        return false;
                    }
                    // Don't transpile node_modules
                    return /node_modules/.test(file);
                },
                use: ["babel-loader"]
            },

            // ts
            {
                test: /\.tsx?$/,
                use: [
                    "thread-loader",
                    "babel-loader",
                    {
                        loader: "ts-loader",
                        options: {
                            transpileOnly: true,
                            appendTsSuffixTo: ["\\.vue$"],
                            happyPackMode: true
                        }
                    }
                ]
            },


            // Images: Copy image files to build folder
            { test: /\.(?:ico|gif|png|jpg|jpeg)$/i, type: "asset/resource" },

            // Fonts and SVGs: Inline files
            { test: /\.(woff(2)?|eot|ttf|otf|svg|)$/, type: "asset/inline" }
        ]
    },

    resolve: {
        modules: [config.src, "node_modules"],
        extensions: [".js", ".jsx", ".json"],
        alias: {
            "@": config.src
        }
    }
};