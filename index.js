import gulpLoadPlugins from 'gulp-load-plugins';
import minimist from 'minimist';
import del from 'del';
import lazypipe from 'lazypipe';
import normalize from 'normalize-path';
import {basename} from 'path';
import {
  readFileSync
} from 'fs';

const knownOptions = {
  string: ['env', 'config']
};

const options = minimist(process.argv.slice(2), knownOptions);


/**
 * Returns a config object by checking three sources in this order:
 *  1. If there was a --config option passed in the cli options, use the
 *  config.json file provided there.
 *  2. If 1 failed, and there is a config.json file in the project folder, use that config.json
 *  3. If 1 and 2 failed, and there is an environment variable PSTASKS_ROOT, use the config.json in that directory.
 *  4. If the first 3 failed, throw an error.
 *
 * @return {object|null}
 */
function loadConfig() {
  if (options.config) {
    console.log(`Using config.json found at ${options.config}`);
    const normalizedPath = normalize(options.config);
    const configStr = readFileSync(`${normalizedPath}/config.json`).toString();
    return JSON.parse(configStr);
  }
  try {
    const configStr = readFileSync('./config.json').toString();
    console.log('Using config.json found in project folder');
    return JSON.parse(configStr);
  } catch (e) {
    const psTasksRoot = process.env['PSTASKS_ROOT'];
    if (!psTasksRoot) {
      throw new Error('Unable to locate config. PSTASKS_ROOT env var not set.');
    } else {
      const normalizedPath = normalize(psTasksRoot);
      try {
        const configStr = readFileSync(`${psTasksRoot}/config.json`)
          .toString();
        console.log(`using config.json in PSTASKS_ROOT: ${psTasksRoot}`);
        return JSON.parse(configStr);
      } catch (e) {
        console.log(`error reading config.json found at ${psTasksRoot}`);
      }
    }

  }
  console.log('Could not load config.json -- all three loading methods failed');
  return null;
}

/**
 * registers the following gulp tasks to the project-level (local) gulp
 * @param  {object} gulp default export
 * @param  {string} __dirname of the project folder that gulp command was executed from
 * @return {null}
 */
export default function(gulp, projectPath) {
  const config = loadConfig();
  if (!options.env) {
    options.env = config.default_deploy_target;
  }

  const plugins = gulpLoadPlugins();

  if (!config.default_deploy_target && !knownOptions.env) {
    throw new Error('No deploy target provided in cli options or the default_deploy_target config option');
  }

  // No image server
  gulp.task('build-plugin', () =>
    gulp.src(['plugin/**', 'plugin.xml'])
    .pipe(gulp.dest('dist'))
  );

  gulp.task('build-src', ['build-plugin'], () =>
    gulp.src('src/**')
    .pipe(gulp.dest('dist/web_root'))
  );

  gulp.task('zip', ['build-src'], () =>
    gulp.src('dist')
    .pipe(plugins.zip('plugin.zip'))
    .pipe(gulp.dest('dist'))
  );

  gulp.task('clean', () => {
    del(['dist/*', '!dist/*.zip'])
  });

  gulp.task('build-no-img', ['build-plugin', 'build-src', 'zip', 'clean'])

  gulp.task('deploy', () =>
    gulp.src('dist/src/**')
    .pipe(deploy())
  );

  gulp.task('watch-deploy', () =>
    gulp.src('src/**')
    .pipe(plugins.watch('src/**'))
    .pipe(preprocess())
    .pipe(deploy())
  );

  gulp.task('build', ['build:less', 'build:sass', 'build:static', 'build:babel'], () =>
    gulp.src([
      './plugin/**/*',
      './src/**/*',
      './queries_root/**/*',
      'plugin/plugin.xml',
      '!src/**/*.less',
      '!src/**/.*scss',
      '!src/**/*.{png,gif,jpg,bmp,swf,js}',
      '!src/**/ext/**',
      '!src/**/less{,/**}',
      '!src/**/sass{,/**}',
      '!plugin/web_root/admin/**/*.js'
    ], {
      base: './'
    })
    .pipe(preprocess())
    .pipe(gulp.dest('dist'))
  );

  gulp.task('build:static', () =>
    gulp.src([
      './src/**/*.{jpg,png,gif,bmp,swf}',
      './src/**/ext/**',

      //treat all js files within /admin as a static resource
      './plugin/web_root/admin/**/*.js'
    ], {
      base: './'
    })
    .pipe(gulp.dest('dist/'))
  );

  gulp.task('package', () =>
    gulp.src('dist/plugin/**')
    .pipe(plugins.zip('plugin.zip'))
    .pipe(gulp.dest('dist'))
  );

  gulp.task('build:babel', () =>
    gulp.src([
      './src/**/*.js',
      '!src/**/ext/**'
    ], {
      base: './'
    })
    .pipe(preprocess())
    .pipe(plugins.babel({
      plugins: [
        'transform-es2015-modules-amd',
        'transform-es2015-classes'
      ]
    }))
    .pipe(gulp.dest('dist'))
  );

  const deploy = lazypipe()
    .pipe(() => {
      const env = options.env;
      return plugins.if(config.hasOwnProperty(env), plugins.sftp(config[env].deploy_credentials))
    });

  const preprocess = lazypipe()
    .pipe(() => {
      const env = options.env;
      const context = {
        context: {}
      };
      if (config[env].sams_url) {
        context.context.SAMS_URL = config[env].sams_url;
      }
      if (config[env].api_url) {
        context.context.API_URL = config[env].api_url;
      }
      if (config[env].ps_url) {
        context.context.PS_URL = config[env].ps_url;
      }
      return plugins.if(config.hasOwnProperty(env), plugins.preprocess(context));
    });

  gulp.task('build:lint', () =>
    gulp.src('src/**/*.js')
    .pipe(plugins.eslint())
    .pipe(plugins.eslint.format())
  );

  gulp.task('build:less', () =>
    gulp.src([
      'src/**/*.less',
      '!src/**/ext/**',
      '!src/**/less/**'
    ])
    .pipe(plugins.less())
    .pipe(preprocess())
    .pipe(gulp.dest('dist/src'))
  );

  gulp.task('build:sass', () =>
    gulp.src([
      'src/scripts/*',
      '!src/**/ext/**'
    ])
    .pipe(plugins.flatmap((stream, dir) =>
      gulp.src(dir.path + '/**/*.scss')
        .pipe(plugins.sass().on('error', plugins.sass.logError))
        .pipe(plugins.concatCss('css/bundle.css'))
        .pipe(gulp.dest('dist/src/scripts/' + basename(dir.path)))
    ))
  );
}
