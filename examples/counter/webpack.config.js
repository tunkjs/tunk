'use strict';
// 清除生成目录文件
let exec = require('child_process').execSync;
exec('rm -rf build/*');

let path = require('path');
let webpack = require('webpack');

module.exports = {
    devtool: 'cheap-module-eval-source-map',
    entry: {
        main: './index.js',
    },
    output: {
        path: __dirname + '/build/',
        filename: '[name].bundle.js',
        publicPath: '/build/',
        chunkFilename: '[id].bundle.js?[chunkhash]',
    },
    resolve: {
        extensions: ['', '.js', '.vue']
    },
    module: {
        loaders: [
            {
                test: /\.vue$/,
                loader: 'vue',
            },
            {
                test: /\.js$/,
                loader: 'babel',
                exclude: /(node_modules|ckeditor)/
            }
        ],
    },
    vue: {
        loaders: {
            js: 'babel',
            html: 'vue-html-loader',
        }
    },
};
