import gulpLoadPlugins from 'gulp-load-plugins';
import minimist from 'minimist';
import del from 'del';
import lazypipe from 'lazypipe';
import normalize from 'normalize-path';
import { readFileSync } from 'fs';

const psTasksRoot = process.env['PSTASKS_ROOT'];
const normalizedRoot = normalize(psTasksRoot);
const config = JSON.parse(readFileSync(`${normalizedRoot}/config.json`).toString());
console.log('config == ', config);

export default function (gulp) {
    const plugins = gulpLoadPlugins();
    const knownOptions = {
        string: ["env"],
        default: {
            env: config.default_deploy_target
        }
    };

    if (!config.default_deploy_target && !knownOptions.env) {
        throw new Error('No deploy target provided in cli options or the default_deploy_target config option');
    }

    if (!psTasksRoot) {
        throw new Error('Unable to locate config. PSTASKS_ROOT env var not set.');
    }

    const options = minimist(process.argv.slice(2), knownOptions);

    // No image server
    gulp.task("build-plugin", () =>
        gulp.src(["plugin/**", "plugin.xml"])
        .pipe(gulp.dest("dist"))
    );

    gulp.task("build-src", ["build-plugin"], () =>
        gulp.src("src/**")
        .pipe(gulp.dest("dist/web_root"))
    );

    gulp.task("zip", ["build-src"], () =>
        gulp.src("dist")
        .pipe(plugins.zip("plugin.zip"))
        .pipe(gulp.dest("dist"))
    );

    gulp.task("clean", ["zip"], () => {
        del(["dist/*", "!dist/*.zip"])
    });

    gulp.task("build-no-img", ["build-plugin", "build-src", "zip", "clean"])

    gulp.task("deploy", () =>
        gulp.src("dist/src/**")
        .pipe(plugins.debug())
        .pipe(deploy())
    );

    gulp.task("watch-deploy", () =>
        gulp.src("src/**")
        .pipe(plugins.watch("src/**"))
        .pipe(preprocess())
        .pipe(deploy())
    );

    gulp.task("build", ["less", "build-static", "babel"], () =>
        gulp.src([
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
        .pipe(gulp.dest("dist"))
    );

    gulp.task("build-static", () =>
        gulp.src([
            "./src/**/*.{jpg,png,gif,bmp,swf}",
            "./src/**/ext/**"
        ], {
            base: "./src"
        })
        .pipe(gulp.dest("dist/src"))
    );

    gulp.task("package", () =>
        gulp.src("dist/plugin/**")
        .pipe(plugins.zip("plugin.zip"))
        .pipe(gulp.dest("dist"))
    );

    gulp.task("babel", () =>
        gulp.src([
            "./src/**/*.js",
            "!src/**/ext/**"
        ], {
            base: "./"
        })
        .pipe(plugins.debug())
        .pipe(preprocess())
        .pipe(plugins.babel())
        .pipe(gulp.dest("dist"))
    );

    const deploy = lazypipe()
        .pipe(() => {
            const env = options.env;
            return plugins.if(config.hasOwnProperty(env), plugins.sftp(config[env].deploy_credentials))
        });

    const preprocess = lazypipe()
        .pipe(() => {
            const env = options.env;
            return plugins.if(config.hasOwnProperty(env), plugins.preprocess({
                context: {
                    IMAGE_SERVER_URL: config[env].image_server_url,
                    SAMS_URL: config[env].sams_url,
                    API_URL: config[env].api_url
                }
            }));
        });

    gulp.task("lint", () =>
        gulp.src("src/**/*.js")
        .pipe(plugins.eslint())
        .pipe(plugins.eslint.format())
    );

    gulp.task("less", () =>
        gulp.src([
            "src/**/*.less",
            "!src/**/ext/**",
            "!src/**/less/**"
        ])
        .pipe(plugins.less())
        .pipe(preprocess())
        .pipe(gulp.dest("dist/src"))
    );
}
