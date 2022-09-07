const path = require("path");
const ESLintWebpackPlugin = require("eslint-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinizerWebpackPlugin = require("css-minimizer-webpack-plugin");
const TerserWebpackPlugin = require("terser-webpack-plugin");
const ImageMinizerWebpackPlugin = require("image-minimizer-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");

// 需要通过 cross-env 定义环境变量
const isProduction = process.env.NODE_ENV === "production";
const getStyleLoaders = (preProcessor) => {
    return [
        isProduction ? MiniCssExtractPlugin.loader : "style-loader",
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
        preProcessor && {
            loader: preProcessor,
            options: preProcessor === "less-loader" ? {
                 // antd的自定义主题
                lessOptions: {
                modifyVars: {
                  // 其他主题色：https://ant.design/docs/react/customize-theme-cn
                  "@primary-color": "#1DA57A", // 全局主色
                },
                javascriptEnabled: true,
              },
            } : {}
        }
    ].filter(Boolean)
}

module.exports = {
    entry: "./src/index.js",
    output: {
        path: isProduction ? path.resolve(__dirname, "../dist") : undefined,
        filename: isProduction ? "static/js/[name].[contenthash:10].js" : "static/js/[name].js",
        chunkFilename: isProduction ? "static/js/[name].[contenthash:10].chunk.js" : "static/js/[name].chunk.js",
        assetModuleFilename: "static/js/[hash:10][ext][query]",
        clean: true
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
                            plugins: [
                                !isProduction && "react-refresh/babel"
                            ].filter(Boolean)
                        }
                    }
                ]
            }
        ]
    },
    plugins: [
        new ESLintWebpackPlugin({
            extensions: [".js", ".jsx"],
            context: path.resolve(__dirname, "../src"),
            exclude: "node_modules",
            cache: true,
            cacheLocation: path.resolve(__dirname, "../node_modules/.cache/.eslintcache")
        }),
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, "../public/index.html")
        }),
        isProduction &&
        new MiniCssExtractPlugin({
            filename: "static/css/[name].[contenthash:10].css",
            chunkFilename: "static/css/[name].[contenthash:10].chunk.css"
        }),
        isProduction &&
        new CopyPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, "../public"),
                    to: path.resolve(__dirname, "../dist"),
                    globOptions: {
                        // 忽略文件
                        ignore: ["**/index.html"]
                    }
                }
            ]
        }),
        !isProduction && new ReactRefreshWebpackPlugin(),
    ].filter(Boolean),
    optimization: {
        minimize: isProduction,
        minimizer: [
            new CssMinizerWebpackPlugin(),
            new TerserWebpackPlugin(),
            new ImageMinizerWebpackPlugin({
                minimizer: {
                    implementation: ImageMinizerWebpackPlugin.imageminGenerate,
                    options: {
                        plugins: [
                          ["gifsicle", { interlaced: true }],
                          ["jpegtran", { progressive: true }],
                          ["optipng", { optimizationLevel: 5 }],
                          [
                            "svgo",
                            {
                              plugins: [
                                "preset-default",
                                "prefixIds",
                                {
                                  name: "sortAttrs",
                                  params: {
                                    xmlnsOrder: "alphabetical",
                                  },
                                },
                              ],
                            },
                          ],
                        ],
                    }
                }
            })
        ],
        splitChunks: {
            chunks: "all",
            cacheGroups: {
                // 如果项目中使用antd，此时将所有node_modules打包在一起，那么打包输出文件会比较大。
                // 所以我们将node_modules中比较大的模块单独打包，从而并行加载速度更好
                // 如果项目中没有，请删除
                antd: {
                    name: "chunk-antd",
                    test: /[\\/]node_modules[\\/]antd(.*)/,
                    priority: 30,
                },
                // 将react相关的库单独打包，减少node_modules的chunk体积。
                react: {
                  name: "react",
                  test: /[\\/]node_modules[\\/]react(.*)?[\\/]/,
                  chunks: "initial",
                  priority: 20,
                },
                libs: {
                  name: "chunk-libs",
                  test: /[\\/]node_modules[\\/]/,
                  priority: 10, // 权重最低，优先考虑前面内容
                  chunks: "initial",
                },
            }
        },
        runtimeChunk: {
            name: (entryPonit) => `runtime~${entryPonit.name}`
        },
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
        historyApiFallback: true,
    },
    mode: isProduction ? "production" : "development",
    devtool: isProduction ? "source-map" : "cheap-module-source-map",
    performance: false // 关闭性能分析，提示速度
}