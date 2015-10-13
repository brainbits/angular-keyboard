module.exports = function(config) {
	config.set({
        "files": [
            require.resolve('angular/angular.js'),
            require.resolve('angular-mocks/angular-mocks.js'),
            'dist/ng-keyboard.js',
            'test/**/*Test.js'
        ],
        "frameworks": ['mocha', 'chai', 'sinon', 'sinon-chai'],
        "browsers": ["Chrome"],
        "colors": true,
        "client": {
            "captureConsole": true,
            mocha: {
                reporter: 'spec'
            }
        }
    });
};