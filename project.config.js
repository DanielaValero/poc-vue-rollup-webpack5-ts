
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path");

module.exports = {
    entry: path.resolve(__dirname, "./src/main.ts"),
    src: path.resolve(__dirname, "./src"),
    public: path.resolve(__dirname, "./public"),
    outputDirWebpack: path.resolve(__dirname, "./dist/webpack"),
    outputDirRollup: path.resolve(__dirname, "./dist/webpack"),

    dev: {
        publicPath: "/",
        port: 8080
    },

    build: {
        publicPath: "/"
    }
};