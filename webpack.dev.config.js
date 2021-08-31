/* eslint-disable @typescript-eslint/no-var-requires */

const path = require("path");

module.exports = {
  entry: "./src/index2.ts",
  output: {
    filename: "koinos.js",
    path: path.resolve(__dirname, "dist"),
  },
  resolve: {
    extensions: [".webpack.js", ".web.js", ".ts", ".js"],
  },
  module: {
    rules: [{ test: /\.ts$/, loader: "ts-loader" }],
  },
  optimization: {
    minimize: false,
  },
};
