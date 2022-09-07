const path = require("path");
const ESLintWebpackPlugin = require("eslint-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const getStyleLoaders = (preProcessor) => {
    return [
        "style-loader",
        "css-loader",
        {
            // 解决兼容性问题
            loader: "postcss-loader",
            options: {
                postcssOptions: {
                    plugins: ["postcss-preset-env"]
                }
            }
        },
        preProcessor
    ].filter(Boolean)
}
module.exports = {
    entry: "./src/index.js",
    output: {
        path: undefined,
        filename: "static/js/[name].js",
        chunkFilename: "static/js/[name].chunk.js",
        assetModuleFilename: "static/js/[hash:10][ext][query]"
    },
    module: {
        rules: [
            {
                oneOf: [
                    {
                        test: /\.css$/,
                        use: getStyleLoaders()
                    },
                    {
                        test: /\.less$/,
                        use: getStyleLoaders("less-loader")
                    },
                    {
                        test: /\.s[ac]ss$/,
                        use: getStyleLoaders("sass-loader")
                    },
                    {
                        test: /\.styl$/,
                        use: getStyleLoaders("stylus-loader")
                    },
                    {
                        test: /\.(png|jpe?g|gif|svg)$/,
                        type: "asset",
                        parser: {
                            dataUrlCondition: {
                                maxSize: 10 * 1024 // 少于10KB会被base64处理
                            }
                        }
                    },
                    {
                        test: /\.(ttf|woff2?)$/,
                        type: "asset/resource"
                    },
                    {
                        test: /\.(jsx|js)$/,
                        include: path.resolve(__dirname, "../src"),
                        loader: "babel-loader",
                        options: {
                            cacheDirectory: true, // 开启babel缓存
                            cacheCompression: false, // 缓存文件不要压缩
                            // react-refresh/babel开启HMR功能
                            plugins: ["react-refresh/babel"]
                        }
                    }
                ]
            }
        ]
    },
    plugins: [
        new ESLintWebpackPlugin({
            context: path.resolve(__dirname, "../src"),
            exclude: "node_modules",
            cache: true,
            cacheLocation: path.resolve(__dirname, "../node_modules/.cache/.eslintcache")
        }),
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, "../public/index.html")
        }),
        // 开启HMR热更新功能
        new ReactRefreshWebpackPlugin(),
        new CopyPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, "../public"),
                    to: path.resolve(__dirname, "../dist"),
                    toType: "dir",
                    // 不生成错误
                    noErrorOnMissing: true,
                    globOptions: {
                        // 忽略文件
                        ignore: ["**/index.html"]
                    },
                    info: {
                        // 跳过terser压缩js
                        minimized: true
                    }
                }
            ]
        })
    ],
    optimization: {
        splitChunks: {
            chunks: "all"
        },
        runtimeChunk: {
            name: (entryPonit) => `runtime~${entryPonit.name}`
        }
    },
    resolve: {
        // 自动补全文件拓展名，让jsx可以使用
        extensions: [".jsx", ".js", ".json"]
    },
    devServer: {
        open: true,
        host: "localhost",
        port: 3000,
        hot: true,
        compress: true,
        // 解决react-router刷新404问题
        historyApiFallback: true
    },
    mode: "development",
    devtool: "cheap-module-source-map"
}