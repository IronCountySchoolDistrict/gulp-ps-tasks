# gulp-ps-tasks
`gulp-ps-tasks` is a collection of Gulp tasks that makes it easier and faster to develop PowerSchool customizations and deploy them to a PowerSchool "image" server (cdn).


## Installation
### Requirements
- [Gulp](https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md/)
- [Npm](https://www.npmjs.com/)

## Configuration
### config.json
NOTE: You only to do configure this project if you want to deploy your project to an image server.

Make a copy of the `.config.example.json` file named `config.json`, filling in your own server's sftp credentials.

```
{
  "dev8.3": {
    "image_server_url": "https://images.example.com",
    "sams_url": "https://sams.example.com",
    "deploy_credentials": {
      "host": "127.0.0.1",
      "user": "user",
      "pass": "password",
      "remotePath": "/usr/share/nginx/psimages"
    }
  }
}
```

## Task Usage
Run a task using `gulp {taskname}`
### `build`
Uses a  [preprocessor](https://www.npmjs.com/package/preprocessor) to insert the image server url into your project. Places the resulting files in the `dist` folder.

### `package`
Creates a `.zip` file with using all of the files in the `dist` folder. The `build` task places its files in the `dist` folder, so this task is almost always run after running build.

### `watch-deploy`
Run the `preprocessor` on everything in your project's `src` folder and automatically deploy those files to your image server. Useful for making rapid development changes.
