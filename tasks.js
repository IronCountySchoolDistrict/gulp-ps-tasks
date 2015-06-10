module.exports = function(gulp) {

    var plugins = require("gulp-load-plugins")();
    var config = require("./config.json");

    var minimist = require("minimist");
    var del = require("del");
    var lazypipe = require("lazypipe");

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
        return gulp.src("dist/src/**")
            .pipe(plugins.if(options.env === "dev", plugins.sftp(config.dev.deploy_credentials)))
            .pipe(plugins.if(options.env === "prod", plugins.sftp(config.prod.deploy_credentials)));
    });

    gulp.task("watch-deploy", function() {
        return gulp.src("src/**")
            .pipe(plugins.watch("src/**"))
            .pipe(plugins.sftp(config.test.deploy_credentials));
    });

    gulp.task("build", ["less", "build-static"], function() {
        return gulp.src([
                "./plugin/**/*",
                "./src/**/*",
                "plugin/plugin.xml",
                "!src/**/*.less",
                "!src/**/*.{png,gif,jpg,bmp,swf}",
                "!src/ext/**/*"
            ], {
                base: "./"
            })
            .pipe(plugins.debug())
            .pipe(preprocess())
            .pipe(gulp.dest("dist"));
    });

    gulp.task("build-static", function() {
        return gulp.src([
                "./src/**/*.{jpg,png,gif,bmp,swf}",
                "./src/ext/**"
            ] , {base: "./src"})
            .pipe(gulp.dest("dist/src"));
    });

    gulp.task("package", function() {
        return gulp.src("dist/plugin/**")
            .pipe(plugins.zip("plugin.zip"))
            .pipe(gulp.dest("dist"));
    });

    var preprocess = lazypipe()
        .pipe(function() {
            return plugins.if(options.env === "dev", plugins.preprocess({
                context: {
                    IMAGE_SERVER_URL: config.dev.image_server_url,
                    SAMS_URL: config.dev.sams_url
                }
            }));
        })
        .pipe(function() {
            return plugins.if(options.env === "prod", plugins.preprocess({
                context: {
                    IMAGE_SERVER_URL: config.prod.image_server_url,
                    SAMS_URL: config.prod.sams_url
                }
            }));
        });

    gulp.task("lint", function() {
        return gulp.src("src/**/*.js")
            .pipe(plugins.eslint())
            .pipe(plugins.eslint.format());
    });

    gulp.task("less", function() {
        return gulp.src("src/**/*.less")
            .pipe(plugins.less())
            .pipe(preprocess())
            .pipe(gulp.dest("dist/src"));
    });
};