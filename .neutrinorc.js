const path = require('path')
const fs = require('fs')
const child_process = require('child_process')

const clean = require('@neutrinojs/clean');
const minify = require('@neutrinojs/minify');
const { optimize } = require('webpack');
const nodeExternals = require('webpack-node-externals');
const R = require('ramda')
const Future = require('fluture')

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

    neutrino => neutrino.use(
      '@neutrinojs/react',
      {
        // Disable HTML template builds for library builds
        html: !isLibraryBuild(neutrino)
          ? { title: 'React Object Editor' }
          : false
      }
    ),

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

          // Remove existing entry points (added by another middleware like web, react)
          neutrino.config.entryPoints.clear()

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

    // Command for publishing to npm
    neutrino => {
      neutrino.register('publish', () => {
        const isNextRelease = neutrino.options.args.next
        const packageJson = neutrino.options.packageJson
        const mainFile = path.resolve(path.join(neutrino.options.output, packageJson.main))
        const readme = path.join(__dirname, 'README.md')

        return Future.node(done => fs.access(mainFile, done))
          .mapRej(() => {
            console.log()
            console.error('No main file in output directory. Please run npm build')
          })

          // Create package.json for publishing
          .chain(() => {
            const trimPackageJson = R.omit([ 'devDependencies', 'scripts' ])()(packageJson)
            return Future.encase3(JSON.stringify, trimPackageJson, null, ' ')
          })
          .chain(packageJsonString => {
            const publishablePackageJsonPath = path.resolve(path.join(neutrino.options.output, 'package.json'))
            return Future
              .node(done => fs.writeFile(publishablePackageJsonPath, packageJsonString, done))
          })

          // Copy README to build & substitute assets
          .chain(() => Future.node(done => fs.readFile(readme, done)))
          .chain(readmeContents => {
            const substituteAssets = readmeContents.toString().replace(
              /\(assets\/([\w\-_.]+)\)/,
              '(https://github.com/b-gran/object-editor-react/raw/master/assets/$1)'
            )
            return Future.node(done => fs.writeFile(
              path.resolve(path.join(neutrino.options.output, 'README.md')),
              substituteAssets,
              done
            ))
          })

          // Run publish
          .chain(() => {
            console.log()
            console.log(`Publishing version ${packageJson.version} to npm ${isNextRelease ? '(@next release) ' : ''}...`)

            const command = isNextRelease
              ? `npm publish --tag next`
              : `npm publish`

            return Future.node(done =>
              child_process.exec(
                command,
                { cwd: neutrino.options.output },
                done
              )
            )
          })
      })
    }
  ]
};

function isLibraryBuild (neutrino) {
  return (
    neutrino.options.command === 'build' &&
    neutrino.options.args._.includes('library')
  )
}
