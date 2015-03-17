var KeyboardService = require('./KeyboardService');

module.exports =  ['$$keyboardParserProvider', function KeyboardProvider($$keyboardParserProvider) {

    this.addKeyMapping = $$keyboardParserProvider.addKeyMapping;
    this.setKeyMappings = $$keyboardParserProvider.setKeyMappings;
    this.addMacro = $$keyboardParserProvider.addMacro;
    this.setMacros = $$keyboardParserProvider.setMacros;

    this.$get = ['$injector', function($injector) {
        var keyboard = $injector.instantiate(KeyboardService);
        keyboard.enable();
        return keyboard;
    }];

}];