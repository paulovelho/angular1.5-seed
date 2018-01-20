const g = require("gulp-load-plugins")({ lazy: false });
const gulp = require("gulp");
const path = require("path");
const exec = require("child_process").exec;

const runSequence = require("run-sequence");

const paths = {
  indexHtml: "app/index.html",
  html: [
    "app/**/*.html",
    "!app/index.html"
  ],
  languages: [
    "app/language/*.json"
  ],
  images: [
    "app/img/**/*"
  ],
  fonts: [
    "app/fonts/**/*"
  ],
  scss: [
    "app/**/*.scss"
  ],
  scssEntryPoint: "app/scss/styles.app.scss",
  jsDev: [
    "www/**/*.js",
    "!www/lib/**/*"
  ],
  getJsConfig() { return `www/app/configs/${global.runtimeConfig}.js`; },
  jsConfigFolder: [
    "www/app/configs/**"
  ],
  testFiles: [ // relative to www pls
    "../test/unit/globals.js",
    "../test/unit/factories/**/*.js",
    "**/*.html",
    "**/.json"
  ],
  testFolder: [
    "../app/**/*.test.js"
  ],
  ts: [
    "app/**/*.ts"
  ],
  log: "log",
//  deploymentLog: "log/deploy.json",
//  deployConfig: "config/deploy.json",
  karmaConf: path.join(__dirname, "test/karma.conf.js"),
};

require(path.join(__dirname, "tasks/build"))(gulp, g, paths);

gulp.task("serve", (done) => {
  runSequence(["build", "watch"], () => {
    // Start Ionic Server without launching browser
    const command = "./node_modules/ionic/bin/ionic serve --address 0.0.0.0 --port 8100 --nobrowser";
    execCommand(command, "", done, true);
    console.log("Awesomeness is in the air: http://localhost:8100");
  });
});



// Watch for file changes
gulp.task("watch", () => {
  gulp.watch(paths.images, ["images"]);
  gulp.watch(paths.languages, ["languages"]);
  gulp.watch(paths.scss, ["styles"]);
  gulp.watch(paths.ts, ["js-app"]);
  gulp.watch(paths.jsBower, ["js-bower"]);
  gulp.watch(paths.html, ["html"]);
});

function execCommand(command, successMsg, done, silent) {
  const ls = exec(command);
  if (!silent) {
    ls.stdout.on("data", (data) => {
      console.log(data.toString());
    });
  }
  ls.stderr.on("data", (data) => {
    console.error(data.toString());
  });
  ls.on("exit", () => {
    console.log(successMsg.toString());
    done();
  });
}



