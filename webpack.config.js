const path = require('path');

module.exports = {
  entry: {
    // index: './src/index.js',
    requirements: './src/requirements.js'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'public/js')
  }
}