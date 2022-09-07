const path = require("path");
const ESLintWebpackPlugin = require("eslint-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinizerWebpackPlugin = require("css-minimizer-webpack-plugin");
const TerserWebpackPlugin = require("terser-webpack-plugin");
const ImageMinizerWebpackPlugin = require("image-minimizer-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const getStyleLoaders = (preProcessor) => {
    return [
        MiniCssExtractPlugin.loader,
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
        path: path.resolve(__dirname, "../dist"),
        filename: "static/js/[name].[contenthash:10].js",
        chunkFilename: "static/js/[name].[contenthash:10].chunk.js",
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
        new MiniCssExtractPlugin({
            filename: "static/css/[name].[contenthash:10].css",
            chunkFilename: "static/css/[name].[contenthash:10].chunk.css"
        }),
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
        })
    ],
    optimization: {
        splitChunks: {
            chunks: "all"
        },
        runtimeChunk: {
            name: (entryPonit) => `runtime~${entryPonit.name}`
        },
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
        ]
    },
    resolve: {
        // 自动补全文件拓展名，让jsx可以使用
        extensions: [".jsx", ".js", ".json"]
    },
    mode: "production",
    devtool: "source-map"
}