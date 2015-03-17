var KeyboardService = require('./KeyboardService');

module.exports =  ['$$keyboardParserProvider', function KeyboardProvider($$keyboardParserProvider) {

    this.addKeyMapping = $$keyboardParserProvider.addKeyMapping;
    this.setKeyMappings = $$keyboardParserProvider.setKeyMappings;
    this.addMacro = $$keyboardParserProvider.addMacro;
    this.setMacros = $$keyboardParserProvider.setMacros;

    this.$get = ['$$keyboardParser', '$document', '$window', '$log', function($$keyboardParser, $document, $window, $log) {
        var keyboard = KeyboardService($$keyboardParser, $document, $window, $log);
        keyboard.enable();
        return keyboard;
    }];

}];