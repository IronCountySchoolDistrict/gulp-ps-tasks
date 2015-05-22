module.exports = function(gulp, plugins) {
    var credentials = require(".././deploy-credentials.json");

    // No image server
    gulp.task("build-plugin", function() {
        return gulp.src(["plugin/**", "plugin.xml"])
            .pipe(gulp.dest("dist"));
    });

    gulp.task("build-src", ["build-plugin"], function() {
        return gulp.src("src/**")
            .pipe(gulp.dest("dist/web_root"));
    });

    gulp.task("zip", ["build-src"], function() {
        return gulp.src("dist")
            .pipe(plugins.zip("plugin.zip"))
            .pipe(gulp.dest("dist"));
    });

    gulp.task("clean", ["zip"], function() {
        plugins.del(["dist/*", "!dist/*.zip"]);
    });

    gulp.task("build-no-img", ["build-plugin", "build-src", "zip", "clean"]);

    gulp.task("test-deploy", function() {
        return gulp.src("src/**")
            .pipe(plugins.sftp(credentials.test));
    });

    gulp.task("watch-deploy", function() {
        return gulp.src("src/**")
            .pipe(plugins.watch("src/**"))
            .pipe(plugins.sftp(credentials.test));
    });

    gulp.task("build", function() {
        return gulp.src("plugin/**")
            .pipe(plugins.zip("plugin.zip"))
            .pipe(gulp.dest("dist"));
    });

    gulp.task("lint", function() {
        return gulp.src("src/**")
            .pipe(plugins.jshint())
            .pipe(plugins.jshint.reporter("default"));
    });
}