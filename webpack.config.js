const path = require('path');
const webpack = require('webpack');
const glob = require('glob');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackExcludeAssetsPlugin = require('html-webpack-exclude-assets-plugin');

const devMode = process.env.NODE_ENV === 'development';

// pages 配下のフォルダ名の配列を取得
const folderNames = glob.sync("./src/pages/**/*.html")
  .map(path => path.match(new RegExp('^.+/([^/]+)/[^/]+\.html'))[1]);

// common.scss + pages/<フォルダ名> 配下のファイルを entryPoints に指定
const entries = folderNames.reduce((c, name) => {
  c[name] = [
    './src/pages/common.scss',
    ...glob.sync(`./src/pages/${name}/*.js`),
    ...glob.sync(`./src/pages/${name}/*.scss`)
  ];
  return c;
}, {});

module.exports = {
  mode: devMode ? 'development' : 'production',
  devtool: devMode ? 'inline-source-map' : false,
  entry: entries,

  output: {
    // js の出力設定
    filename: devMode ? 'assets/js/[name].js' : 'assets/js/[id].[chunkhash].js',
    path: path.resolve(__dirname, 'dist')
  },

  plugins: [
    new CleanWebpackPlugin(),
    new webpack.ProgressPlugin(),
    new webpack.ProvidePlugin({ '$' : 'jquery' }),
    // css の出力設定
    new MiniCssExtractPlugin({
      filename: devMode ? 'assets/css/[name].css' : 'assets/css/[id].[hash].css',
      chunkFilename: devMode ? 'assets/css/[name].css' : 'assets/css/[id].[hash].css',
    }),
    // html の出力と css, js の埋め込み設定
    ...folderNames.map(name => new HtmlWebpackPlugin({
      inject: 'head',
      chunks: ['common', 'vendor', name],
      template: glob.sync(`./src/pages/${name}/*.html`)[0],
      filename: `${name}/index.html`,
      excludeAssets: [/(0|common)\..*.js/], // exclude common.js
      meta: [
        { charset: 'UTF-8' },
        { viewport: 'width=device-width, initial-scale=1' },
        { 'http-equiv': 'X-UA-Compatible', content: 'IE=edge' }
      ],
      hash: true,
    })),
    new HtmlWebpackExcludeAssetsPlugin()
  ],

  module: {
    rules: [
      {
        test: /.(js|jsx)$/,
        include: [path.resolve(__dirname, 'src')],
        loader: 'babel-loader',
        options: {
          babelrc: false,
          configFile: path.resolve(__dirname, 'babel.config.js'),
          cacheDirectory: true
        }
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              hmr: devMode,
            },
          },
          {
            loader: 'css-loader',
            options: {
              url: true,
              importLoaders: 2,
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              plugins: [
                require('autoprefixer')({
                  grid: true,
                  cascade: false,
                }),
              ]
            }
          },
          { loader: 'sass-loader' }
        ],
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        include: [path.resolve(__dirname, 'src/assets')],
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192,
              name: '[name].[ext]',
              publicPath: '../img',
              outputPath: 'assets/img'
            },
          },
        ],
      },
      {
        test: /\.html$/,
        include: [path.resolve(__dirname, 'src/partial')],
        use: {
          loader: "html-loader",
          options: {
            attrs: [':data-src']
          }
        }
      }
    ]
  },

  optimization: {
    splitChunks: {
      cacheGroups: {
        common: {
          // Common Styles
          test: /common\.scss/,
          name: 'common',
          chunks: 'initial',
          enforce: true,
        },
        vendor: {
          // node_modules配下のモジュールをバンドル対象とする
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          chunks: 'initial',
          enforce: true
        },
      }
    }
  },

  // `npm start` で起動する local server 環境の設定
  devServer: {
    open: true,
    openPage: 'home',
    contentBase: path.join(__dirname, 'src'),
    watchContentBase: true
  },

  performance: {
    maxEntrypointSize: 500000,
    maxAssetSize: 1000000,
  },
};