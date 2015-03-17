var KeyboardService = require('./KeyboardService');

module.exports =  ['$$keyboardParserProvider', function KeyboardProvider($$keyboardParserProvider) {

    this.addKeyMapping = $$keyboardParserProvider.addKeyMapping;
    this.setKeyMappings = $$keyboardParserProvider.setKeyMappings;
    this.addMacro = $$keyboardParserProvider.addMacro;
    this.setMacros = $$keyboardParserProvider.setMacros;

    this.$get = ['$$keyboardParser', '$document', '$window', '$log', '$rootScope', function($$keyboardParser, $document, $window, $log, $rootScope) {
        var keyboard = KeyboardService($$keyboardParser, $document, $window, $log, $rootScope);
        keyboard.enable();
        return keyboard;
    }];

}];