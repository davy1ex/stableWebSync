const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const Dotenv = require('dotenv-webpack');

module.exports = {
    entry: "./src/app/index.tsx",
    output: {
        filename: "[name].[contenthash].js",
        path: path.resolve(__dirname, "dist"),
        publicPath: "/",
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js", "jsx"],
        alias: {
            "@": path.resolve(__dirname, "src"),
        },
    },
    devtool: "source-map",
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        transpileOnly: true,
                    }
                },
                exclude: [/node_modules/, /\.test\.(ts|tsx)$/],
            },
            {
                test: /\\.(ts|js)x?$/,
                exclude: [/node_modules/, /\.test\.(ts|tsx)$/],
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: [
                            "@babel/preset-env",
                            "@babel/preset-react",
                            "@babel/preset-typescript"
                        ]
                    }
                }
            },
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"],
            },
            {
                test: /\.(png|jpe?g|gif|svg)$/i,
                type: "asset/resource",
            }
        ]
    },
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({ template: "./public/index.html" }),
        new Dotenv(),
    ],
    devServer: {
        static: "./dist",
        hot: true,
        historyApiFallback: true,
        port: 3000,
    },
    mode: "development"
};