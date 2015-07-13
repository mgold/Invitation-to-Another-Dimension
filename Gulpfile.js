var gulp = require('gulp');
var sass = require('gulp-sass');

gulp.task('sass', function() {
    gulp.src('sass/**/*.scss')
        .pipe(sass({
            errLogToConsole: true,
            }))
        .pipe(gulp.dest('./css/'))
});


gulp.task('default', function() {
    gulp.watch('sass/**/*.scss',['sass']);
});
