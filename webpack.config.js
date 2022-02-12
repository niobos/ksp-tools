const path = require('path');
const HtmlMinimizerPlugin = require("html-minimizer-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const jsxPages = {
    'engines': 'KSP - Engine selection',
    'electricity': 'KSP - Electricity calculator',
    'mining': 'KSP - Mining calculator',
};
const tsxPages = {
    'commnet': 'KSP - CommNet link calculator',
    'orbits': 'KSP - Changing obits',
    'kerbin-to-minmus': 'KSP - Kerbin departures to Minmus '
};

const entries = {};
const pluginsHtmlWebpack = []
for(let page in jsxPages) {
    entries[page] = `./src/${page}.jsx`;
    pluginsHtmlWebpack.push(new HtmlWebpackPlugin({
        template: 'src/react-template.html',
        filename: `${page}.html`,
        chunks: [page],
        title: jsxPages[page],
    }));
}
for(let page in tsxPages) {
    entries[page] = `./src/${page}/app.tsx`;
    pluginsHtmlWebpack.push(new HtmlWebpackPlugin({
        template: 'src/react-template.html',
        filename: `${page}.html`,
        chunks: [page],
        title: tsxPages[page],
    }));
}

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
            extensions: ['.tsx', '.ts', '.jsx', '.js']
        },
        module: {
            rules: [
                {
                    test: /\.([jt]sx?)$/,
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
