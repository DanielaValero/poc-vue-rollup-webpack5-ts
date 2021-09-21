const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const { DefinePlugin } = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const PrettierPlugin = require("prettier-webpack-plugin");
const ESLintPlugin = require("eslint-webpack-plugin");
const { VueLoaderPlugin } = require("vue-loader");
const config = require("../project.config");
const path = require("path");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

module.exports = {
    // Where webpack looks to start building the bundle
    entry: {
        app: config.entry,
        fragment: config.fragment,
        // fragment: {
        //     entry: config.fragment,
        //     filename: "fragment.html"
        // }
    },

    // Where webpack outputs the assets and bundles
    output: {
        path: config.outputDirWebpack,
        publicPath: config.dev.publicPath,
        filename: '[name].bundle.js',
    },
    
  
    resolve: {
        alias: {
            "@": config.src
        },
        extensions: [".ts", ".tsx", ".js", ".jsx", ".vue", ".json"],
        modules: [config.src, "node_modules"],
        plugins: [
            new TsconfigPathsPlugin({ configFile: path.resolve(__dirname, "../tsconfig.json") })
        ]
   
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
                    from: path.resolve(__dirname, "../src/assets/images"), 
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
            template: path.resolve(__dirname, "../public/index.html"), 
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
            __VUE_I18N_LEGACY_API__: "false",
            __INTLIFY_PROD_DEVTOOLS__: "true"

            //  ...resolveClientEnv({ publicPath: config.dev.publicPath })
        })
    ],

    // Determine how modules within the project are treated
    module: {
        noParse: /^(vue|vue-router|vuex|vuex-router-sync)$/,

        rules: [
            {
                test: /.vue$/,
                loader: "vue-loader",
            },
            {
                test: /(\.ce)?\.vue$/,
                loader: "vue-loader",
                // options: {
                //     compilerOptions: {
                //         customElement: true
                //     }
                // }
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
                use: ["thread-loader", "babel-loader"]
            },
      
            // ts
            {
                test: /\.ts?$/,
                use: [
                    // "thread-loader",
                    "babel-loader",
                    "ts-loader"
                ],
                exclude: /node_modules/
            },


            // Images: Copy image files to build folder
            { test: /\.(?:ico|gif|png|jpg|jpeg)$/i, type: "asset/resource" },

            // Fonts and SVGs: Inline files
            { test: /\.(woff(2)?|eot|ttf|otf|svg|)$/, type: "asset/inline" }
        ]
    }

   
};