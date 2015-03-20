var KeyboardService = require('./KeyboardService');

module.exports =  ['$$keyboardParserProvider', function KeyboardProvider($$keyboardParserProvider) {

    this.addKeyMapping = function() {
        $$keyboardParserProvider.addKeyMapping.apply($$keyboardParserProvider, arguments);
    };

    this.setKeyMappings = function() {
        $$keyboardParserProvider.setKeyMappings.apply($$keyboardParserProvider, arguments);
    };

    this.addMacro = function() {
        $$keyboardParserProvider.addMacro.apply($$keyboardParserProvider, arguments);
    };

    this.setMacros = function() {
        $$keyboardParserProvider.setMacros.apply($$keyboardParserProvider, arguments);
    };

    this.$get = ['$injector', function($injector) {
        var keyboard = $injector.instantiate(KeyboardService);
        keyboard.enable();
        return keyboard;
    }];

}];