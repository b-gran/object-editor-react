const path = require('path')
const clean = require('@neutrinojs/clean');
const minify = require('@neutrinojs/minify');
const { optimize } = require('webpack');
const nodeExternals = require('webpack-node-externals');
const R = require('ramda')

const EXAMPLES_DIR = path.resolve(path.join(__dirname, 'examples'))
const SRC_DIR = path.resolve(path.join(__dirname, 'src'))

module.exports = {
  options: {
    // Entry point files for development only
    mains: {
      mainExample: path.join(EXAMPLES_DIR, 'example.js'),
      githubExample: path.join(EXAMPLES_DIR, 'github-example.js'),
    },

    library: {
      name: 'ObjectEditor',

      // Entry point files for build/release only
      libraryEntries: {
        index: path.join(SRC_DIR, 'index.js'),
      },
    },
  },
  use: [
    // Adds the examples to webpack's compilation
    ['@neutrinojs/compile-loader', {
      include: [ EXAMPLES_DIR ],
    }],

    ['@neutrinojs/react', {
      html: {
        title: 'React Object Editor'
      },
    }],

    '@neutrinojs/jest',

    // Set up builds of the library
    neutrino => {
      const options = R.mergeDeepLeft({
        clean: neutrino.options.library.clean !== false && {
          paths: [neutrino.options.output]
        },
      })(neutrino.options.library)

      neutrino.config.when(
        neutrino.options.command === 'build' &&
        neutrino.options.args._.includes('library'),
        () => {
          // We build as a library, so don't use any webpack chunking.
          // If these plugins are used, the library module won't be importable
          // because the dependencies in the chunk will be missing.
          neutrino.config.when(
            neutrino.config.plugins.has('runtime-chunk'),
            (config) => {
              config.plugins
                .delete('runtime-chunk')
                .delete('vendor-chunk')
                .delete('named-modules')
                .delete('named-chunks')
                .delete('name-all');
            }
          )

          neutrino.config.when(
            options.clean,
            () => neutrino.use(clean, options.clean)
          );

          // Add the files in "libraryEntries" as webpack entry points.
          Object
            .keys(options.libraryEntries)
            .forEach(key => neutrino.config.entry(key).add(options.libraryEntries[key]))

          // Set up the actual library build
          neutrino.config
            .devtool('source-map')
            .target('web')
            .context(neutrino.options.root)
            .output
            .path(neutrino.options.output)
            .library(options.name)
            .filename('[name].js')
            .libraryTarget('umd')
            .umdNamedDefine(true)
            .end()


            // Reduce file size by separating externals & minifying
            .when(process.env.NODE_ENV !== 'test', config => config.externals([nodeExternals()]))
            .when(process.env.NODE_ENV === 'production', (config) => {
              neutrino.use(minify);
              config
                .plugin('module-concat')
                .use(optimize.ModuleConcatenationPlugin);
            })
        })
    },
  ]
};
