module.exports = function(gulp) {

    var plugins = require("gulp-load-plugins")();
    var config = require("./config.json");

    var minimist = require("minimist");
    var del = require("del");

    var knownOptions = {
        string: ["env"],
        default: {
            env: process.env.NODE_ENV || "dev"
        }
    };

    var options = minimist(process.argv.slice(2), knownOptions);

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
        del(["dist/*", "!dist/*.zip"]);
    });

    gulp.task("build-no-img", ["build-plugin", "build-src", "zip", "clean"]);

    gulp.task("deploy", function() {
        return gulp.src("src/**")
            .pipe(plugins.if(options.env === "dev", plugins.sftp(config.dev.deploy_credentials)))
            .pipe(plugins.if(options.env === "prod", plugins.sftp(config.prod.deploy_credentials)));
    });

    gulp.task("watch-deploy", function() {
        return gulp.src("src/**")
            .pipe(plugins.watch("src/**"))
            .pipe(plugins.sftp(config.test.deploy_credentials));
    });

    gulp.task("build", function() {
        return gulp.src("plugin/**")
            .pipe(plugins.template({
                img_srv_url: config.dev.image_server_url
            }))
            .pipe(plugins.zip("plugin.zip"))
            .pipe(gulp.dest("dist"));
    });

    gulp.task("lint", function() {
        return gulp.src("src/**")
            .pipe(plugins.jshint())
            .pipe(plugins.jshint.reporter("default"));
    });
};