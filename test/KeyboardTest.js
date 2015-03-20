describe('$keyboard', function() {

    beforeEach(module('mve.keyboard'));

    describe('configuring the parser', function() {

        var $$keyboardParserProvider,
            $keyboardProvider;

        beforeEach(module(function(_$$keyboardParserProvider_, _$keyboardProvider_) {
            $$keyboardParserProvider = _$$keyboardParserProvider_;
            $keyboardProvider = _$keyboardProvider_;
            sinon.stub($$keyboardParserProvider, 'setKeyMappings');
            sinon.stub($$keyboardParserProvider, 'setMacros');
        }));

        it('passes mappings to $$keyboardParserProvider', function() {

            module(function(_$keyboardProvider_) {
                $keyboardProvider.setKeyMappings({
                    65: 'a'
                });
                $keyboardProvider.setMacros({
                });
            });

            inject(function() {
                expect($$keyboardParserProvider.setKeyMappings).to.be.called;
            });
        });


    });

});