import _ from 'lodash';
import async from 'async';

import gulp from 'gulp';
import babel from 'gulp-babel';
import sourcemaps from 'gulp-sourcemaps';
import sass from 'gulp-sass';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';
import rename from 'gulp-rename';
import uglify from 'gulp-uglify';
import plumber from 'gulp-plumber';
import emptyFunction from 'fbjs/lib/emptyFunction';

/* Browserify + plugins */
import browserify from 'browserify';
import watchify from 'watchify';
import babelify from 'babelify';
import envify from 'envify';

import del from 'del';
import size from 'gulp-size';
import gutil from 'gulp-util';
import runSequence from 'run-sequence';
import chalk from 'chalk';

import cache from 'gulp-cached';

import path from 'path';
import fs from 'fs';

import pjson from './package.json';

// Convenience function for copying files
// Returns an object with the following format
// {
//      src: String,
//      dest: String,
// }
//
// Usage:
//      copy('path/to/src.js').to('path/to/dest/js')
const copy = src => ({
    to: dest => ({
        src, dest
    })
});

const config = {
    src: [ 'src/**/*.js' ],
    
    // For debugging compiled code
    srcRoot: path.join(__dirname, 'src'),

    // Directory containing scss files
    styles: [ 'src/test/**/*.scss' ],

    // Any additional files that should be copied over to dist/
    // Format:
    // {
    //      src: String, // relative path to the file from the project root
    //      dest: String, // destination path for the file
    // }
    copies: {
        production: [
            copy('package.json').to('dist/'),
            copy('README.md').to('dist/'),
            copy('LICENSE').to('dist/'),
        ],

        dev: [
            copy('package.json').to('dist/'),
            copy('README.md').to('dist/'),
            copy('LICENSE').to('dist/'),
            copy('src/test/index.html').to('dist'),
        ],
    },

    // The main dev bundle
    bundle: {
        file: './src/test/index.js', name: 'bundle'
    },

    // Modules to pack into external bundle for use by client bundle
    deps: [
        'lodash',
        'react',
        'react-dom',
    ],

    // Babel compilation options
    optsBabel: {
        presets: [ 'es2015', 'react', 'stage-0' ]
    },
};

// Print nice, colorful errors
function mapError (err) {
    console.dir(err);
    console.log(err.stack);
    if (err.fileName) {
        // regular error
        return gutil.log(chalk.red(err.name)
            + ': '
            + chalk.yellow(err.fileName.replace(__dirname + '/src/js/', ''))
            + ': '
            + 'Line '
            + chalk.magenta(err.lineNumber)
            + ' & '
            + 'Column '
            + chalk.magenta(err.columnNumber || err.column)
            + ': '
            + chalk.blue(err.description));
    } else {
        // browserify error
        gutil.log(chalk.red(err.name)
            + ': '
            + chalk.yellow(err.message));
    }
};

// Log file watcher updates to console
function mapUpdate (evt) {
    let type = evt.type || 'updated';

    // For non-browserify events, the changed paths are in evt.path
    // For browserify events, evt is the changed paths
    // evt.path & path can either be a single path or an array of paths.
    let paths = _.flatten([ (evt.path || evt) ]);

    _.each(paths, (path) => {
        let shortenedPath = path.split('src').reduce((prev, current) => current);
        gutil.log(
            'File ' +
            chalk.green(shortenedPath) +
            ' was ' +
            chalk.blue(type) +
            '. Rebuilding...'
        );
    })
};

// Clean the dist directory
let clean = () => del([ 'dist/**', ]);
gulp.task('clean', clean);

// Convert es6 files to es5
gulp.task('babel:dev', (done) => {
    gulp.src(config.src)
        .pipe(plumber(mapError))
        .pipe(cache('babel'))
        .pipe(sourcemaps.init())
        .pipe(babel())
        .pipe(sourcemaps.write('.', { sourceRoot: config.srcRoot }))
        .pipe(gulp.dest('dist/'))
        .on('end', done);
});

// Convert es6 files to es5, with minification
gulp.task('babel:production', (done) => {
    gulp.src(config.src)
        .pipe(plumber(mapError))
        .pipe(cache('babel'))
        .pipe(babel())
        .pipe(uglify())
        .pipe(gulp.dest('dist/'))
        .on('end', done);
});

// To cache the files for use by the watch task,
// the cache argument will be used as the key
// for the cache.
function copyFile (src, dest, cacheKey) {
    if (cacheKey) {
        return gulp
            .src(src)
            .pipe(cache(cacheKey))
            .pipe(gulp.dest(dest));
    } else {
        return gulp
            .src(src)
            .pipe(gulp.dest(dest));
    }
}

// Make copies of an array of { src, dest } objects.
// Calls cb (function cb (err) -> void) when done.
function copyAll (copies, cb) {
    async.each(
        copies,
        ({ src, dest }, next) => {
            copyFile(
                src,
                dest,
                src + dest
            ).on('end', next);
        },
        cb
    );
}

gulp.task('copies:dev', done => {
    copyAll(config.copies.dev, done);
});

gulp.task('copies:production', done => {
    copyAll(config.copies.production, done);
});

// Compile sass files to css
gulp.task('styles', () => {
    return gulp.src(config.styles)
        // Use sass's own error handler, otherwise the stream will
        // break on error.
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('dist/stylesheets/'));
});

// Generates a browserify bundler for a file
const getBundler = file => _.flow(
    // First apply watchify
    watchify,

    // Then transforms
    transformBundler({
        NODE_ENV: 'development',
        DEBUG: true,
    })
)(
    // Creates the base bundler
    browserify(
        file,
        {
            ...getBundler._baseOpts,
            debug: true,
        }
    )
);
getBundler._baseOpts = {
    extensions: ['.js'],
};

// Takes environment variables and returns a function that takes a browserify
// bundler and applies transforms to it.
const transformBundler = env => bundler => {
    // Apply browserify transforms to the bundler
    const transformed = bundler
        // babelify transform -- compiles ES6 to ES5 for the bundle
        // See https://github.com/babel/babelify
        .transform(
            babelify,
            config.optsBabel
        )

        // envify transform -- allows us to set & use environment vars in the browser
        // See https://github.com/hughsk/envify
        .transform(
            'envify',
            {
                ...env,
                // See https://github.com/hughsk/envify/issues/27
                global: true
            }
        );

    // Then make all client deps external
    return _.reduce(
        config.deps,
        (modifiedBundle, dep) => modifiedBundle.external(dep),
        transformed
    );
}

// Create a bundle from a watchify or browserify bundle
let bundle = (bundler, bundleName, cb = emptyFunction) => {
    if (!bundler) throw new Error('A bundler is required.');
    if (!bundleName) throw new Error('A bundle name is required.');

    const outputDirectory = 'dist/javascripts';

    return bundler.bundle()
        .pipe(plumber(mapError))
        .pipe(source(`${bundleName}.js`))
        .pipe(buffer())
        .pipe(gulp.dest(outputDirectory))

        // Run minifier
        .pipe(rename(`${bundleName}.min.js`))
        .pipe(sourcemaps.init({ loadMaps: true }))
            // Capture sourcemaps from transforms
            .pipe(uglify())
        .pipe(sourcemaps.write('.'))
        
        .pipe(size())
        .pipe(gulp.dest(outputDirectory))
        .on('end', cb);
};

// Returns a bundle stream of the client-side dependencies
const bundleDeps = clientDeps => {
    const bundler = browserify();

    // Explicitly require all npm and client component dependencies
    return (
        _.reduce(
            clientDeps,
            (modifiedBundler, dep) => modifiedBundler.require(dep),
            bundler
        )
    ).bundle();
};

gulp.task('deps', done => {
    const outputDirectory = 'dist/javascripts';
    bundleDeps(config.deps)
        // Un-minified
        .pipe(source('deps.js'))
        .pipe(buffer())
        .pipe(gulp.dest(outputDirectory))

        // Run minifier
        .pipe(rename('deps.min.js'))
        .pipe(sourcemaps.init({ loadMaps: true }))
        // Capture sourcemaps from transforms
        .pipe(uglify())
        .pipe(sourcemaps.write('.'))

        .pipe(size({
            title: 'Deps bundle'
        }))

        // Output minified to /public
        .pipe(gulp.dest(outputDirectory))
        .on('end', done);
});

gulp.task('client', (done) => {
    let bundler = getBundler(config.bundle.file, true);

    bundle(bundler, config.bundle.name, done);

    bundler.on('update', () => {
        gutil.log(
            `Rebundling ${chalk.green(config.bundle.file)}
            (${chalk.blue(config.bundle.name)} bundle)...`
        );

        return bundle(
            bundler,
            config.bundle.name,
            () => gutil.log(`Finished bundling ${chalk.blue(config.bundle.name)}`)
        );
    });

    bundler.on('error', err => {
        mapError(err);
    });
});

gulp.task('watch', () => {
    // Returns a stream that watches src for changes and runs task.
    // If isCached is true, removes deleted files from the cache
    // for that task.
    function watch ({ src, opts = {} }, task, isCached) {
        let watcher = gulp.watch(src, opts, [ task ]);
        watcher.on('change', mapUpdate);

        if (isCached) {
            watcher.on('change', (evt) => {
                // Remove delete scripts from the cache
                if (evt.type === 'deleted') {
                    delete cache.caches[task][evt.path];
                }
            });
        }
        return watcher;
    };

    // We don't need to return these.
    const watchBabel = watch({ src: config.src }, 'babel:dev', true);
    const watchCopies = _.map(
        config.copies.dev,
        ({ src }) => watch({ src }, 'copies:dev')
    );
    const watchStyles = watch({ src: config.styles }, 'styles');
});

// Prepare the already-built dist directory for publishing to npm.
gulp.task('pack', done => {
    // Remove dev stuff from package.json
    const npmPackage = _.omit(
        pjson,
        [ 'devDependencies', 'scripts' ]
    );

    // Update package.json in the dist/ directory
    fs.writeFile('dist/package.json', JSON.stringify(npmPackage, null, '  '), 'utf-8', done);
});

gulp.task('dev', (done) => {
    runSequence(
        'clean',
        [ 'styles', 'copies:dev', 'client', 'deps', 'babel:dev' ],
        'watch',
        done
    );
});

gulp.task('production', done => {
    runSequence(
        'clean',
        [ 'copies:production', 'babel:production' ],
        'pack',
        done
    );
});

gulp.task('default', [ 'production' ]);
