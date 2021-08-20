const path = require('path');

module.exports = {
    target: 'web',
    entry: {
        index: './src/index.js'
    },
    resolve: {
        modules: [path.resolve(__dirname, './src'), 'node_modules']
    },
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: 'backend-tables.js',
        library: 'backendTables',
        libraryTarget: 'umd',
        umdNamedDefine: true
    },
    mode: 'production'
}