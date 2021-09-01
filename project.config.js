
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path");

module.exports = {
    src: path.resolve(__dirname, "../src"),
    public: path.resolve(__dirname, "../public"),
    outputDir: path.resolve(__dirname, "../dist"),

    dev: {
        publicPath: "/",
        port: 8080
    },

    build: {
        publicPath: "/"
    }
};