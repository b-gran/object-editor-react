const path = require('path')

const EXAMPLES_DIR = path.resolve(path.join(__dirname, 'examples'))

module.exports = {
  options: {
    mains: {
      mainExample: path.join(EXAMPLES_DIR, 'example.js'),
    },
  },
  use: [
    // Add the examples to webpack's compilation
    ['@neutrinojs/compile-loader', {
      include: [ EXAMPLES_DIR ],
    }],

    ['@neutrinojs/react', {
      html: {
        title: 'neutrino_react'
      },
    }],
  ]
};
