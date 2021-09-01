const webpack = require("webpack");
const { merge } = require("webpack-merge");
const config = require("../project.config");
const baseWebpackConfig = require("./webpack.base.js");
const cssWebpackConfig = require("./webpack.css.js");


module.exports = merge(baseWebpackConfig, cssWebpackConfig, {
    // Set the mode to development or production
    mode: "development",

    // Control how source maps are generated
    // devtool: 'inline-source-map',
    devtool: "eval-cheap-module-source-map",

    // Spin up a server for quick development
    devServer: {
        historyApiFallback: true,
        // contentBase: config.build,
        open: false,
        compress: true,
        hot: true,
        port: config.dev.port,
        devMiddleware: {
            publicPath: config.dev.publicPath
        }
    },

    plugins: [
    // Only update what has changed on hot reload
        new webpack.HotModuleReplacementPlugin()
    ]
});