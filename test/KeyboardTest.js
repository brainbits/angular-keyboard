describe('$keyboard', function() {

    beforeEach(module('mve.keyboard'));

    describe('configuring the parser', function() {

        var $$keyboardParserProvider;

        beforeEach(module(function(_$$keyboardParserProvider_) {
            $$keyboardParserProvider = _$$keyboardParserProvider_;
            sinon.stub($$keyboardParserProvider);
        }));

        it('passes calls of setKeyMappings to $$keyboardParserProvider', function() {
            var expectedMappings = { 47: 'a', 11: 'b' };

            module(function($keyboardProvider) {
                $keyboardProvider.setKeyMappings(expectedMappings);
            });

            inject(function() {
                expect($$keyboardParserProvider.setKeyMappings).to.be.calledOnce
                    .and.calledWith(expectedMappings);
            });
        });

        it.skip('passes calls of setKeyMappings to $$keyboardParserProvider', function() {
            var expectedMacros = {'a > b': ['foo']};

            module(function($keyboardProvider) {
                $keyboardProvider.setMacros(expectedMacros);
            });

            inject(function() {
                expect($$keyboardParserProvider.setMacros).to.be.calledOnce
                    .and.calledWith(expectedMacros);
            });
        });

        it('passes calls of addKeyMapping to $$keyboardParserProvider', function() {
            var expectedKeycode = 15,
                expectedMappings = ['foo', 'bar'];

            module(function($keyboardProvider) {
                $keyboardProvider.addKeyMapping(expectedKeycode, expectedMappings);
            });

            inject(function() {
                expect($$keyboardParserProvider.addKeyMapping).to.be.calledOnce
                    .and.calledWith(expectedKeycode, expectedMappings)
            });
        });

        it('passes calls of addMacro to $$keyboardParserProvider', function() {
            var expectedCombo = 'ctrl+z',
                expectedNames = ['undo'];

            module(function($keyboardProvider) {
                $keyboardProvider.addMacro(expectedCombo, expectedNames);
            });

            inject(function() {
                expect($$keyboardParserProvider.addMacro).to.be.calledOnce
                    .and.calledWith(expectedCombo, expectedNames)
            });
        });
    });

});