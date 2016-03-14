# gulp-ps-tasks
`gulp-ps-tasks` is a collection of Gulp tasks that makes it easier and faster to develop PowerSchool customizations and deploy them to a PowerSchool "image" server (cdn).


## Installation
#### 1. Install dependencies:
```
npm install -g babel babel-cli babel-register babel-plugin-transform-es2015-modules-commonjs
npm install --save-dev gulp-ps-tasks
```
#### 2. Copy `.babelrc` and `local.gulpfile.babel.js` to the root of your project folder.
#### 3. Rename the local copy of `local.gulpfile.babel.js` to `gulpfile.babel.js`.

## Configuration
### config.json
A `config.json` file is required for the following information:
* Image server sftp credentials
* Any URLs that should be dynamically inserted into your project's code
The `config.json` file location can be specified one of three ways. As soon as a config file is found, the search for a config file stops and the first config file found is used. Note that the config path should only include the path to your `config.json` file -- it should not include the `config.json` filename itself. Trailing slashes don't matter, they will be removed if they're included.

1. Command Line Option: add a `--config {configPath}` option to your `gulp {taskname}` command. Example: `gulp build --config /home/nathan/projects/plugins`.
2. `config.json` is placed in your project folder.
3. Set an environment variable, `PSTASKS_ROOT`, to the directory path of your `config.json` file.

If you have a large number of plugins, I recommend using method 3 because it allows you to create and maintain a single `config.json` file that can be used across all of your plugins. However, if you want it to just work, use method 2.

### config.example.json
The following config example should be used as a starting point for your own `config.json` file.
```
{
  "image_server_name": {
    "sams_url": "https://sams.example.com",
    "api_url": "https://api.example.com",
    "deploy_credentials": {
      "host": "sftp_host",
      "user": "user",
      "pass": "password",
      "remotePath": "/path/to/assets/folder"
    }
  },

  "image_server_name2": {
    "sams_url": "https://sams.example.com",
    "api_url": "https://api.example.com",
    "deploy_credentials": {
      "host": "sftp_host",
      "user": "user",
      "pass": "password",
      "remotePath": "/path/to/assets/folder"
    }
  },
  
  // Optional: If no --env options is passed to the deploy task, 
  // provide the "image_server_name" that should be used as a default
  "default_deploy_target": "image_server_name"
}
```

### Local gulpfile
In order to use the gulp tasks included here with your own project, make a copy of the `local.gulpfile.babel.js` file and rename it to `gulpfile.babel.js`.

## Task Usage
Run a task using `gulp {taskname}`
### `build`
Uses a  [preprocessor](https://www.npmjs.com/package/preprocessor) to insert the image server url into your project. Places the resulting files in the `dist` folder.

### `package`
Creates a `.zip` file with using all of the files in the `dist` folder. The `build` task places its files in the `dist` folder, so this task is almost always run after running build.

### `watch-deploy`
Run the `preprocessor` on everything in your project's `src` folder and automatically deploy those files to your image server. Useful for making rapid development changes.
