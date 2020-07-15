const path = require('path');
const packagejson = require('./package.json');
const webpack = require("webpack")

const dashLibraryName = packagejson.name.replace(/-/g, '_');

module.exports = (env, argv) => {

    let mode;

    const overrides = module.exports || {};

    // if user specified mode flag take that value
    if (argv && argv.mode) {
        mode = argv.mode;
    }

    // else if configuration object is already set (module.exports) use that value
    else if (overrides.mode) {
        mode = overrides.mode;
    }

    // else take webpack default (production)
    else {
        mode = 'production';
    }

    let filename = (overrides.output || {}).filename;
    if(!filename) {
        const modeSuffix = mode === 'development' ? 'dev' : 'min';
        filename = `${dashLibraryName}.${modeSuffix}.js`;
    }

    const entry = overrides.entry || {main: './src/lib/index.ts'};

    const devtool = overrides.devtool || 'eval-source-map';

    const externals = ('externals' in overrides) ? overrides.externals : ({
        react: 'React',
        'react-dom': 'ReactDOM',
        'prop-types': 'PropTypes',
    });

    return {
        mode,
        entry,
        output: {
            path: path.resolve(__dirname, dashLibraryName),
            filename,
            library: dashLibraryName,
            libraryTarget: 'window',
        },
        devtool,
        externals,
        module: {
            rules: [
                {
                    test: /\.jsx?$/,
                    exclude: [
                        /node_modules/,
                        /dist/,
                        path.resolve(__dirname, dashLibraryName),
                    ],
                    use: {
                        loader: 'babel-loader',
                        options: {
                            cacheDirectory: true,
                        }
                    },
                },
                {
                    test: /\.css$/,
                    use: [
                        {
                            loader: 'style-loader',
                            options: {
                                insertAt: 'top'
                            }
                        },
                        {
                            loader: 'css-loader',
                        },
                    ],
                },
                {
                    test: /\.tsx?$/,
                    use: 
                    { 
                        loader:'ts-loader',
                        options: {
                            onlyCompileBundledFiles: true,
                            experimentalFileCaching: true
                        },
                    },
                    exclude: [
                        /node_modules/,
                        /dist/,
                        path.resolve(__dirname, dashLibraryName),
                    ],
                },
                {
                    test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
                    use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: '[name].[ext]',
                            outputPath: "/assets",
                        }
                    }
                    ]
                }
            ],
        },
        resolve: {
            extensions: [ '.tsx', '.ts', '.js' ],
        },
         plugins: [
            new webpack.WatchIgnorePlugin([
                    /\.js$/,
                    /\.d\.ts$/
                ])
            ],
    }
};
