const { merge } = require("webpack-merge");
const config = require("../project.config");
const baseWebpackConfig = require("./webpack.base.js");
const cssWebpackConfig = require("./webpack.css.js");


module.exports = merge(baseWebpackConfig, cssWebpackConfig, {
    // Set the mode to development or production
    mode: "development",

    // Control how source maps are generated
    devtool: "inline-source-map",

    // Spin up a server for quick development
    devServer: {
        historyApiFallback: true,
        open: false,
        compress: false,
        hot: true,
        port: config.dev.port,
        devMiddleware: {
            publicPath: config.dev.publicPath
        }
    }
});