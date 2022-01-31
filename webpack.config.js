const path = require('path');
const HtmlMinimizerPlugin = require("html-minimizer-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const pages = {
    'engines': 'KSP - Engine selection',
    'electricity': 'KSP - Electricity options',
};
const entries = Object.keys(pages).reduce((acc, page) => {acc[page] = `./src/${page}.jsx`; return acc}, {});
const pluginsHtmlWebpack = Object.keys(pages).map((page) => new HtmlWebpackPlugin({
    template: 'src/react-template.html',
    filename: `${page}.html`,
    chunks: [page],
    title: pages[page],
}));

module.exports = (env, argv) => {
    return {
        entry: entries,
        plugins: [
            ...pluginsHtmlWebpack,
        ],
        devtool: argv.mode === 'development' ? 'eval-source-map' : false,
        output: {
            filename: '[name].js',
            path: path.resolve(__dirname, 'dist'),
        },
        resolve: {
            extensions: ['.js', '.jsx', '.ts']
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
        optimization: {
            splitChunks: {
                chunks: 'all',
            },
            minimize: argv.mode !== 'development',
            minimizer: [
                `...`,
                new HtmlMinimizerPlugin({}),
            ],
        },
    };
};
