const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const WebpackMd5Hash = require('webpack-md5-hash');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: ['./src/index.js'],
  output: {
		path: path.resolve(__dirname, 'dist', 'assets'),
		filename: '[name].[hash].js'
  },
  devtool: 'inline-source-map',
  devServer: {
		contentBase: './dist',
  },
  module: {
		rules: [
			{
				test: /\.scss$/,
				use: [
					MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader', 'sass-loader'
				]
			},
			{ 
				test: /\.js$/, 
				exclude: /node_modules/, 
				loader: ["babel-loader", "eslint-loader"]
			},
			{
        test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              name: '[name].[ext]',
							outputPath: 'fonts/icons/',
            }
					}
        ]
      }
		]
  },
  plugins: [
		new CleanWebpackPlugin(),
		new HtmlWebpackPlugin({
			template: './src/index.html',
			inject: false,
		}),
		new WebpackMd5Hash(),
		new MiniCssExtractPlugin({
			filename: 'css/[name].[contenthash].css',
		})
	]
};