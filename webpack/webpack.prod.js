const { merge } = require("webpack-merge");

const TerserPlugin = require("terser-webpack-plugin");

const baseWebpackConfig = require("./webpack.base.js");
const cssWebpackConfig = require("./webpack.css.js");
const config = require("../project.config");
const terserOptions = require("./terserOptions");

const paths = require("./paths");


module.exports = merge(baseWebpackConfig, cssWebpackConfig, {
    mode: "production",
    devtool: false,
    output: {
        publicPath: config.build.publicPath
    },

    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin(terserOptions())],
        moduleIds: "deterministic",
        splitChunks: {
            cacheGroups: {
                defaultVendors: {
                    name: "chunk-vendors",
                    test: /[\\/]node_modules[\\/]/,
                    priority: -10,
                    chunks: "initial"
                },
                common: {
                    name: "chunk-common",
                    minChunks: 2,
                    priority: -20,
                    chunks: "initial",
                    reuseExistingChunk: true
                }
            }
        }
    },
    performance: {
        hints: false,
        maxEntrypointSize: 512000,
        maxAssetSize: 512000
    }
});