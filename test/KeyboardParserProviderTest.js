describe('$$keyboardParserProvider', function() {


    var $$keyboardParser;

    beforeEach(module('mve.keyboard'));

    describe('configuring the parser', function() {

        beforeEach(module(function($$keyboardParserProvider) {
            $$keyboardParserProvider.setKeyMappings({
                "16": ['foo'],
                "65": ['a']
            });
            $$keyboardParserProvider.setMacros({});
        }));

        it('returns parser function', inject(function($$keyboardParser) {
            expect($$keyboardParser).to.be.a('function');
        }));


    });

});