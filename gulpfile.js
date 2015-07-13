// Include gulp
var gulp = require('gulp'); 

// Include Our Plugins
var jshint = require('gulp-jshint');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var addsrc = require('gulp-add-src');


// Lint Task
gulp.task('lint', function() {
    return gulp.src('runner/src/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

// Concatenate
gulp.task('scripts', function() {
    return gulp.src(['runner/bower_components/jquery/dist/jquery.js', 
                     'runner/bower_components/underscore/underscore.js', 
                     'runner/src/**/*.js'])
        .pipe(concat('csspec-runner.js'))
        .pipe(gulp.dest('runner/dist'));
});

// Concatenate Minified
gulp.task('scripts-min', function() {
    return gulp.src('runner-src/*.js')
        .pipe(uglify())
        .pipe(addsrc.prepend(['runner/bower_components/jquery/dist/jquery.js',
                      'runner/bower_components/underscore/underscore.js'])) 
        .pipe(concat('csspec-runner.min.js'))
        .pipe(gulp.dest('runner/dist'));
});

gulp.task('copy-html', function() {
    return gulp.src('runner/src/*.html')
        .pipe(gulp.dest('runner/dist'));
});

// Watch Files For Changes
gulp.task('watch', function() {
    gulp.watch('runner/src/*.js', ['lint', 'scripts']);
    gulp.watch('runner/src/*.html', ['copy-html']);
});

// Default Task
gulp.task('default', ['lint', 'scripts', 'watch']);
