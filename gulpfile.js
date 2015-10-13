'use strict';

var browserify = require('browserify');
var gulp = require('gulp');
var through2 = require('through2');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var rename = require('gulp-rename');
var karma = require('gulp-karma');

// Rerun the task when a file changes
gulp.task('watch', ['build'], function() {
    gulp.watch('./src/**', ['build']);
});

gulp.task('build', function () {

    return gulp.src('./src/module.js')
        .pipe(browserifyTransform())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(uglify({mangle: false}))
        .pipe(rename('ng-keyboard.js'))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./dist'));

    function browserifyTransform() {
        return through2.obj(function (file, enc, next) {
            browserify(file.path)
                .bundle(function(err, res){
                    file.contents = res;
                    next(null, file);
                });
        });
    }
});

gulp.task('default', ['build']);