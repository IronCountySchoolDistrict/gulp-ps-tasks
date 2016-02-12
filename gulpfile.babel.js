console.log('hi');
import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import runSequence from 'run-sequence';

import del from 'del';

const plugins = gulpLoadPlugins();

gulp.task('build:copy', () =>
    gulp.src([
        'LICENSE',
        'README.md',
        'package.json',
        '.config.example.json'
    ])
    .pipe(gulp.dest('dist'))
);

gulp.task('build:babel', () =>
    gulp.src('index.js')
    .pipe(plugins.babel())
    .pipe(gulp.dest('dist'))
);

gulp.task('clean', () =>
    del(['dist/*'])
);

gulp.task('build', (callback) =>
    runSequence('clean', ['build:copy', 'build:babel'], callback)
);
