module.exports = function(gulp) {

    var plugins = require("gulp-load-plugins")();
    var config = require("./config.json");

    var minimist = require("minimist");
    var del = require("del");
    var lazypipe = require("lazypipe");

    var knownOptions = {
        string: ["env"],
        default: {
            env: process.env.NODE_ENV || "dev8.3"
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
            .pipe(plugins.debug())
            .pipe(deploy());
    });

    gulp.task("watch-deploy", function() {
        return gulp.src("src/**")
            .pipe(plugins.watch("src/**"))
            .pipe(preprocess())
            .pipe(deploy());
    });

    gulp.task("build", ["less", "build-static", "babel"], function() {
        return gulp.src([
                "./plugin/**/*",
                "./src/**/*",
                "./queries_root/**/*",
                "plugin/plugin.xml",
                "!src/**/*.less",
                "!src/**/*.{png,gif,jpg,bmp,swf,js}",
                "!src/**/ext/**",
                "!src/less{,/**}"
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
                "./src/**/ext/**"
            ], {
                base: "./src"
            })
            .pipe(gulp.dest("dist/src"));
    });

    gulp.task("package", function() {
        return gulp.src("dist/plugin/**")
            .pipe(plugins.zip("plugin.zip"))
            .pipe(gulp.dest("dist"));
    });

    gulp.task("babel", function() {
        return gulp.src([
                "./src/**/*.js",
                "!src/**/ext/**"
            ], {
                base: "./"
            })
            .pipe(plugins.debug())
            .pipe(preprocess())
            .pipe(plugins.babel())
            .pipe(gulp.dest("dist"));
    })

    var deploy = lazypipe()
        .pipe(function() {
            var env = options.env;
            return plugins.if(config.hasOwnProperty(env), plugins.sftp(config[env].deploy_credentials))
        });

    var preprocess = lazypipe()
        .pipe(function() {
            var env = options.env;
            return plugins.if(config.hasOwnProperty(env), plugins.preprocess({
                context: {
                    IMAGE_SERVER_URL: config[env].image_server_url,
                    SAMS_URL: config[env].sams_url,
                    API_URL: config[env].api_url
                }
            }));
        });

    gulp.task("lint", function() {
        return gulp.src("src/**/*.js")
            .pipe(plugins.eslint())
            .pipe(plugins.eslint.format());
    });

    gulp.task("less", function() {
        return gulp.src([
                "src/**/*.less",
                "!src/**/ext/**",
                "!src/**/less/**"
            ])
            .pipe(plugins.less())
            .pipe(preprocess())
            .pipe(gulp.dest("dist/src"));
    });
};
