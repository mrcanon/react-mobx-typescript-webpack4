const path = require('path')

module.exports = {
  dev: {
    assetsPublicPath: '/',
    assetsSubDirectory: 'assets',
    autoOpenBrowser: true,
    cssSourceMap: true,
    devtool: 'inline-source-map', // https://webpack.js.org/configuration/devtool/#development
    errorOverlay: true,
    host: 'localhost', // can be overwritten by process.env.HOST
    notifyOnErrors: false,
    poll: false, // https://webpack.js.org/configuration/dev-server/#devserver-watchoptions
    port: 9000, // can be overwritten by process.env.PORT, if port is in use, a free one will be determined
    proxyTable: {}
  },

  production: {
    assetsPublicPath: '',
    assetsRoot: path.resolve(__dirname, '../../dist'),
    assetsSubDirectory: 'assets',
    autoOpenBrowser: true,
    productionSourceMap: true,
    devtool: '#source-map',// https://webpack.js.org/configuration/devtool/#production
    host: 'localhost', // can be overwritten by process.env.HOST
    port: 8080, // can be overwritten by process.env.PORT, if port is in use, a free one will be determined
  }
}
