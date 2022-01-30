const path = require('path');
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = (env, argv) => {
    return {
        entry: {
            engines: './src/engines.jsx',
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: './src/react-template.html',
                title: 'KSP - Engine Selection',
                filename: '[name].html',
            }),
        ],
        devtool: argv.mode === 'development' ? 'eval-source-map' : false,
        output: {
            filename: '[name].js',
            path: path.resolve(__dirname, 'dist'),
        },
        module: {
            rules: [
                {
                    test: /\.(js|jsx|ts)$/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                "@babel/preset-react",
                                "@babel/preset-typescript"
                            ],
                        },
                    },
                },
                {
                    test: /\.css$/i,
                    use: ["style-loader", "css-loader"],
                },
                {
                    test: /\.svg$/,
                    use: [
                        {
                            loader: 'svg-url-loader',
                            options: {
                                limit: 10000,
                            },
                        },
                    ],
                },
            ],
        },
    };
};