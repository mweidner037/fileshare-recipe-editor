import CopyWebpackPlugin from "copy-webpack-plugin";
import * as path from "path";
import * as webpack from "webpack";

const config: webpack.Configuration = {
  mode: "development",
  entry: "./src/renderer/script/renderer.tsx",
  target: "web",
  output: {
    filename: "renderer.js",
    path: path.resolve(__dirname, "build/renderer"),
    clean: true,
  },
  devtool: "eval-source-map",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: "ts-loader",
            options: {
              configFile: "tsconfig-renderer.json",
            },
          },
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.js$/,
        enforce: "pre",
        use: ["source-map-loader"],
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        // Copy static files to build/renderer (merged with .js files).
        {
          from: "./src/renderer/static",
          //to: "./[base]",
        },
      ],
    }),
  ],
};

// eslint-disable-next-line import/no-default-export
export default config;
