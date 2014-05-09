/*
 * Main module. Provides access to each of the submodules under the library.
 */
module.exports = {
    folder: require('./folder'),
    interact: require('./interact'),
    promise: require('./promise'),
    utils: require('./utils'),
    middlewares: require('./middlewares')
}
