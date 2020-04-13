const path = require('path');

module.exports = {
  entry: './server.js',
  output: {
    filename: 'server.js',
    path: path.resolve(__dirname, 'dist')
  },
  node: { fs: 'empty' }
};