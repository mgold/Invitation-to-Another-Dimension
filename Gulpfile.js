var gulp = require('gulp');
var sass = require('gulp-sass');
var browserify = require('browserify');
var source = require('vinyl-source-stream')
var rename = require('gulp-rename')

gulp.task('sass', function() {
    gulp.src('sass/**/*.scss')
        .pipe(sass({
            errLogToConsole: true,
            }))
        .pipe(gulp.dest('./compiled/'))
});

gulp.task('browserify', function () {
    browserify('./js/main.js', {debug: true}).bundle()
        .pipe(source('js/main.js'))
        .pipe(rename('bundle.js'))
        .pipe(gulp.dest('./compiled/'))
});

gulp.task('default', function() {
    gulp.watch('sass/**/*.scss',['sass']);
    gulp.watch('js/**/*.js',['browserify']);
});
