/*global require, module, __dirname, process */
const path = require('path');
module.exports = {
	entry: './src/start',
	devtool: 'source-map',
	output: {
		filename: '[name].js',
		path: path.resolve(__dirname, 'public/site/')
	},
	module: {
		loaders: [{
			test: /\.css$/,
			loader: "style-loader!css-loader"
		}]
	}
};
