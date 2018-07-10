var path = require("path");
var webpack = require("webpack");
const autoprefixer = require("autoprefixer");
const HtmlWebpackPlugin = require("html-webpack-plugin");
var pack = require("./package.json");
var debug = process.env.NODE_ENV !== "production";

const styleLoader = {
  loader: "style-loader",
  options: {
    sourceMap: debug
  }
};
const cssLoader = {
  loader: "css-loader",
  options: {
    minimize: true,
    camelCase: true,
    modules: true,
    importLoaders: true,
    localIdentName: "[name]--[local]",
    sourceMap: debug
  }
};
const postcssLoader = {
  loader: "postcss-loader",
  options: {
    plugins: function() {
      return [autoprefixer];
    },
    sourceMap: debug
  }
};
function getSassLoader(dirname, isProd) {
  const sassOptions = {
    sourceMap: debug,
    includePaths: [
      path.resolve(dirname, "src"),
      path.resolve(dirname, "node_modules"),
      path.resolve(dirname, "node_modules", "font-awesome", "fonts")
    ],
    data: '$fa-font-path: "font-awesome/fonts";'
  };
  return {
    loader: "sass-loader",
    options: sassOptions
  };
}

function createStyleLoaders(dirname) {
  const sassLoader = getSassLoader(dirname, debug);

  return [
    {
      test: /\.(s?)css$/,
      include: [/src\//, /DEV\//],
      exclude: [/node_modules/],
      loaders: [styleLoader, cssLoader, sassLoader, postcssLoader]
    },
    {
      test: /\.(s?)css$/,
      include: [/node_modules/],
      use: [styleLoader, cssLoader, sassLoader]
    }
  ];
}

const sourceMapLoader = {
  test: /\.jsx?$/,
  exclude: /node_modules/,
  enforce: "pre",
  loader: "source-map-loader"
};
const babelLoader = {
  test: /\.jsx?$/,
  exclude: /node_modules/,
  loader: "babel-loader",
  query: {
    babelrc: false,
    presets: ["react", ["es2015", { modules: false }], "stage-0"],
    plugins: ["transform-decorators-legacy"]
  }
};
const jsonLoader = {
  test: /\.json$/,
  loader: "json-loader"
};

const imgLoader = {
  loader: "img-loader"
};

const fileLoader = {
  loader: "file-loader"
};

function getUrlLoader(mimetype, limit = 10000) {
  const urlLoader = {
    loader: "url-loader",
    options: {
      limit
    }
  };

  if (mimetype) {
    urlLoader.options.mimetype = mimetype;
  }

  return urlLoader;
}

const webpackConfig = {
  context: __dirname,
  devtool: debug ? "inline-sourcemap" : false,
  entry: {
    [pack.name]: "./src/index.js"
  },
  output: {
    path: __dirname + "/dist",
    filename: "[name].min.js"
  },
  resolve: {
    modules: [
      path.resolve("node_modules"),
      path.resolve("src/themes/" + (process.env.THEME_NAME || "default")),
      path.resolve("src")
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV)
      }
    }),
    new HtmlWebpackPlugin({
      template: path.resolve("./public/index.html")
    })
  ],
  module: {
    rules: [sourceMapLoader, babelLoader, jsonLoader]
      .concat(createStyleLoaders(__dirname))
      .concat([
        {
          test: /\.(jpe?g|png|gif)$/,
          use: [getUrlLoader(), imgLoader]
        },
        {
          test: /\.svg(\?v=\d+\.\d+\.\d+)?(\?(\w|\d)+)?(\#(\w|\d)+)?$/,
          loader: "svg-url-loader",
          options: {
            stripdeclarations: true
          }
        },
        {
          test: /\.woff(\?v=\d+\.\d+\.\d+)?(\?(\w|\d)+)?(\#(\w|\d)+)?$/,
          loader: getUrlLoader("application/font-woff")
        },
        {
          test: /\.woff2(\?v=\d+\.\d+\.\d+)?(\?(\w|\d)+)?(\#(\w|\d)+)?$/,
          loader: getUrlLoader("application/font-woff")
        },
        {
          test: /\.ttf(\?v=\d+\.\d+\.\d+)?(\?(\w|\d)+)?(\#(\w|\d)+)?$/,
          loader: getUrlLoader("application/octet-stream")
        },
        {
          test: /\.eot(\?v=\d+\.\d+\.\d+)?(\?(\w|\d)+)?(\#(\w|\d)+)?$/,
          loader: fileLoader
        }
      ])
  }
};

const DEV_PORT = pack.devPort || 8000,
  DEV_HOST = "localhost",
  DEV_URL = ["http://", DEV_HOST, ":", DEV_PORT, "/"].join("");

if (debug) {
  webpackConfig.externals = [];
  // Fix for loading fonts from font-awesome in DEV mode
  // development only
  webpackConfig.output.libraryTarget = "umd";
  webpackConfig.output.publicPath = DEV_URL;
  webpackConfig.devServer = {
    inline: true,
    port: DEV_PORT,
    stats: {
      title: "DEV PAGE",
      showErrors: true,
      assets: false,
      chunks: true,
      chunkModules: false,
      colors: true,
      hash: false,
      timings: true,
      version: false
    }
  };
}

module.exports = webpackConfig;
