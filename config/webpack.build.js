const paths = require('./paths')
const packageJson = require('../package')

const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const postcssNormalize = require('postcss-normalize')
const getCSSModuleLocalIdent = require('react-dev-utils/getCSSModuleLocalIdent')

const dependencies = Object.keys(packageJson.dependencies)
const devDependencies = Object.keys(packageJson.devDependencies)
const externals = [
  ...dependencies,
  ...devDependencies,
  /.*material-ui.*/,
]

// style files regexes
const cssRegex = /\.css$/
const cssModuleRegex = /\.module\.css$/
const sassRegex = /\.(scss|sass)$/
const sassModuleRegex = /\.module\.(scss|sass)$/

const isEnvProduction = true
const isEnvDevelopment = false
const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP !== 'false'

const getStyleLoaders = (cssOptions, preProcessor) => {
  const loaders = [
    isEnvDevelopment && require.resolve('style-loader'),
    isEnvProduction && {
      loader: MiniCssExtractPlugin.loader,
      options: {},
    },
    {
      loader: require.resolve('css-loader'),
      options: cssOptions,
    },
    {
      // Options for PostCSS as we reference these options twice
      // Adds vendor prefixing based on your specified browser support in
      // package.json
      loader: require.resolve('postcss-loader'),
      options: {
        // Necessary for external CSS imports to work
        // https://github.com/facebook/create-react-app/issues/2677
        ident: 'postcss',
        plugins: () => [
          require('postcss-flexbugs-fixes'),
          require('postcss-preset-env')({
            autoprefixer: {
              flexbox: 'no-2009',
            },
            stage: 3,
          }),
          // Adds PostCSS Normalize as the reset css with default options,
          // so that it honors browserslist config in package.json
          // which in turn let's users customize the target behavior as per their needs.
          postcssNormalize(),
        ],
        sourceMap: isEnvProduction && shouldUseSourceMap,
      },
    },
  ].filter(Boolean)
  if (preProcessor) {
    loaders.push(
      {
        loader: require.resolve('resolve-url-loader'),
        options: {
          sourceMap: isEnvProduction && shouldUseSourceMap,
        },
      },
      {
        loader: require.resolve(preProcessor),
        options: {
          sourceMap: true,
        },
      }
    )
  }
  return loaders
}

module.exports = {
  mode: 'production',
  entry: paths.appIndexJs,
  output: {
    path: paths.appBuild,
    filename: 'index.js',
    libraryTarget: 'umd',
  },
  externals: externals,
  optimization: {
    minimize: false
  },
  module: {
    strictExportPresence: true,
    rules: [
      // Disable require.ensure as it's not a standard language feature.
      {parser: {requireEnsure: false}},

      // First, run the linter.
      // It's important to do this before Babel processes the JS.
      {
        test: /\.(js|mjs|jsx|ts|tsx)$/,
        enforce: 'pre',
        use: [
          {
            options: {
              cache: true,
              formatter: require.resolve('react-dev-utils/eslintFormatter'),
              eslintPath: require.resolve('eslint'),
              resolvePluginsRelativeTo: __dirname,

            },
            loader: require.resolve('eslint-loader'),
          },
        ],
        include: paths.appSrc,
      },
      {
        oneOf: [
          // Process application JS with Babel.
          // The preset includes JSX, Flow, TypeScript, and some ESnext features.
          {
            test: /\.(js|mjs|jsx|ts|tsx)$/,
            include: paths.appSrc,
            loader: require.resolve('babel-loader'),
            options: {
              customize: require.resolve(
                'babel-preset-react-app/webpack-overrides'
              ),

              plugins: [
                [
                  require.resolve('babel-plugin-named-asset-import'),
                  {
                    loaderMap: {
                      svg: {
                        ReactComponent:
                          '@svgr/webpack?-svgo,+titleProp,+ref![path]',
                      },
                    },
                  },
                ],
              ],
              // This is a feature of `babel-loader` for webpack (not Babel itself).
              // It enables caching results in ./node_modules/.cache/babel-loader/
              // directory for faster rebuilds.
              cacheDirectory: true,
              // See #6846 for context on why cacheCompression is disabled
              cacheCompression: false,

              // TODO
              // compact: true,
            },
          },

          // {
          //   test: cssRegex,
          //   exclude: cssModuleRegex,
          //   use: getStyleLoaders({
          //     importLoaders: 1,
          //     sourceMap: isEnvProduction && shouldUseSourceMap,
          //   }),
          //   // Don't consider CSS imports dead code even if the
          //   // containing package claims to have no side effects.
          //   // Remove this when webpack adds a warning or an error for this.
          //   // See https://github.com/webpack/webpack/issues/6571
          //   sideEffects: true,
          // },
          // // Adds support for CSS Modules (https://github.com/css-modules/css-modules)
          // // using the extension .module.css
          // {
          //   test: cssModuleRegex,
          //   use: getStyleLoaders({
          //     importLoaders: 1,
          //     sourceMap: isEnvProduction && shouldUseSourceMap,
          //     modules: true,
          //     getLocalIdent: getCSSModuleLocalIdent,
          //   }),
          // },
          // // Opt-in support for SASS (using .scss or .sass extensions).
          // // By default we support SASS Modules with the
          // // extensions .module.scss or .module.sass
          // {
          //   test: sassRegex,
          //   exclude: sassModuleRegex,
          //   use: getStyleLoaders(
          //     {
          //       importLoaders: 2,
          //       sourceMap: isEnvProduction && shouldUseSourceMap,
          //     },
          //     'sass-loader'
          //   ),
          //   // Don't consider CSS imports dead code even if the
          //   // containing package claims to have no side effects.
          //   // Remove this when webpack adds a warning or an error for this.
          //   // See https://github.com/webpack/webpack/issues/6571
          //   sideEffects: true,
          // },
          // // Adds support for CSS Modules, but using SASS
          // // using the extension .module.scss or .module.sass
          // {
          //   test: sassModuleRegex,
          //   use: getStyleLoaders(
          //     {
          //       importLoaders: 2,
          //       sourceMap: isEnvProduction && shouldUseSourceMap,
          //       modules: true,
          //       getLocalIdent: getCSSModuleLocalIdent,
          //     },
          //     'sass-loader'
          //   ),
          // },

          // Process any JS outside of the app with Babel.
          // Unlike the application JS, we only compile the standard ES features.
          // {
          //   test: /\.(js|mjs)$/,
          //   exclude: /@babel(?:\/|\\{1,2})runtime/,
          //   loader: require.resolve('babel-loader'),
          //   options: {
          //     babelrc: false,
          //     configFile: false,
          //     compact: false,
          //     presets: [
          //       [
          //         require.resolve('babel-preset-react-app/dependencies'),
          //         {helpers: true},
          //       ],
          //     ],
          //     cacheDirectory: true,
          //     // See #6846 for context on why cacheCompression is disabled
          //     cacheCompression: false,
          //
          //     // If an error happens in a package, it's possible to be
          //     // because it was compiled. Thus, we don't want the browser
          //     // debugger to show the original code. Instead, the code
          //     // being evaluated would be much more helpful.
          //     sourceMaps: false,
          //   },
          // },
        ],
      },
    ],
  },
};