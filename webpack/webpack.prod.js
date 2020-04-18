const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const cssProcessor = require('cssnano');
const merge = require('webpack-merge');
const path = require('path');
const webpack = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const common = require('./webpack.common.js');
const config = require('./config');

const enableBundleAnalyzer = process.env.ENABLE_ANALYZER === 'true';

const webpackConfig = merge(common, {
    mode: 'production',
    devtool: config.production.productionSourceMap ? config.production.devtool : false,
    devServer: {
        host: config.production.host,
        port: config.production.port,
        open: config.production.autoOpenBrowser,
        publicPath: config.production.assetsPublicPath
    },
    output: {
        path: config.production.assetsRoot,
        filename: path.posix.join(config.production.assetsSubDirectory, 'js/[name].[chunkhash].js'),
        chunkFilename: path.posix.join(config.production.assetsSubDirectory, 'js/[name].[chunkhash].js')
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    { loader: MiniCssExtractPlugin.loader },
                    { loader: "css-loader" }
                ]
            },
            {
                test: /\.s(a|c)ss$/,
                use: [
                    { loader: MiniCssExtractPlugin.loader },
                    { loader: "css-loader" },
                    { loader: "sass-loader" }
                ]
            },
            {
                test: /\.less$/,
                use: [
                    { loader: MiniCssExtractPlugin.loader },
                    { loader: 'css-loader' },
                    { loader: 'less-loader' }
                ]
            }
        ]
    },
    optimization: {
        minimizer: [new UglifyJsPlugin({
            uglifyOptions: {
                cache: true,
                warnings: false,
                parse: {},
                compress: {
                    drop_console: true
                },
                mangle: true, // Note `mangle.properties` is `false` by default.
                output: null,
                toplevel: false,
                nameCache: null,
                ie8: false,
                keep_fnames: false,
            },
        })],
        splitChunks: {
            chunks: 'all',
        },
        runtimeChunk: false,
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': require('./config/prod.env')
        }),

        // Compress extracted CSS. We are using this plugin so that possible
        // duplicated CSS from different components can be deduped.
        new OptimizeCssAssetsPlugin({
            cssProcessor,
            cssProcessorPluginOptions: {
                preset: ['default', { discardComments: { removeAll: true } }],
            },
            canPrint: true
        }),
        new HtmlWebpackPlugin({
            filename: 'index.html',
            favicon: path.resolve(__dirname, '../public', 'favicon.ico'),
            template: path.resolve(__dirname, '../public', 'index.html'),
            title: 'Timeline',
            inject: true,
            minify: {
                collapseWhitespace: true,
                removeComments: true,
                removeRedundantAttributes: true,
                removeScriptTypeAttributes: true,
                removeStyleLinkTypeAttributes: true,
                useShortDoctype: true
            },
            chunksSortMode: 'auto'
        }),
        // keep module.id stable when vendor modules does not change
        new webpack.HashedModuleIdsPlugin(),
        // enable scope hoisting
        new webpack.optimize.ModuleConcatenationPlugin(),
        new CleanWebpackPlugin({
            verbose: true,
            dry: false,
            cleanStaleWebpackAssets: true
        }),
        new MiniCssExtractPlugin({
            filename: "[name].[hash:8].css",
            chunkFilename: "[id].[hash:8].css"
        }),
        new ManifestPlugin(),
        new BundleAnalyzerPlugin({
            analyzerMode: enableBundleAnalyzer === true ? 'static' : 'disabled',
            openAnalyzer: true,
        }),
    ]
});

module.exports = webpackConfig