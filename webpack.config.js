const path = require('path');
const HtmlMinimizerPlugin = require("html-minimizer-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const tsxPages = {
    'engines': 'KSP - Engine selection',
    'commnet-link-budget': 'KSP - CommNet link budget calculator',
    'commnet-line-of-sight': 'KSP - CommNet line of sight calculator',
    'orbits': 'KSP - Changing obits',
    'moon-departure': 'KSP - Interplanetary departure from a moon',
    'electricity': 'KSP - Electricity calculator',
    'planner': 'KSP - Mission planner',
    'multiengine': 'KSP - Multi-engine planner',
    'mining': 'KSP - Mining calculator',
    'resource-conversion': 'KSP - Resource Conversion',
};

const entries = {};
const pluginsHtmlWebpack = []
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
                {
                    test: /\.(gif|png|jpe?g)$/i,
                    use: [
                        'file-loader',
                        {
                            loader: 'image-webpack-loader',
                            options: {
                                bypassOnDebug: true, // webpack@1.x
                                disable: true, // webpack@2.x and newer
                            },
                        },
                    ],
                }
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
