module.exports = angular.module('mve.keyboard', [])
    .config(require('./defaultMappings.js'))
    .provider('$$keyboardParser', require('./KeyboardParserProvider.js'))
    .provider('$keyboard', require('./KeyboardProvider.js'));