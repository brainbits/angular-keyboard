'use strict';

var browserify = require('browserify');
var gulp = require('gulp');
var transform = require('vinyl-transform');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var rename = require('gulp-rename');
var karma = require('gulp-karma');

// Rerun the task when a file changes
gulp.task('watch', ['javascript'], function() {
    gulp.watch('./src/**', ['javascript']);
});

gulp.task('javascript', function () {

    var browserified = transform(function(filename) {
        var b = browserify({entries: filename, debug: true});
        return b.bundle();
    });

    return gulp.src('./src/module.js')
        .pipe(browserified)
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(uglify({mangle: false}))
        .pipe(rename('ng-keyboard.js'))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./build'));
});

gulp.task('test', ['javascript'], function() {

    gulp.src([
            'node_modules/angular/angular.js',
            'node_modules/angular-mocks/angular-mocks.js',
            'build/ng-keyboard.js',
            'test/**/*Test.js'
        ])
        .pipe(karma({
            frameworks: ['mocha', 'chai', 'sinon', 'sinon-chai'],
            browsers: ['Chrome'],
            client: {
                captureConsole: true,
                mocha: {
                    reporter: 'spec'
                }
            }
        }));
});

gulp.task('default', ['javascript']);