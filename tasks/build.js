
module.exports = function (gulp, g, paths) {
  let isDist = true;
  const ts = g.typescript;
  const runSequence = require("run-sequence");
  const del = require("del");

  // to enable incremental ts compiling you need to create a global project across watch runs of the tsc task
  let tsProject = null;

  gulp.task("build", (done) => {
    isDist = global.mode === "dist";
    tsProject = getTsProject();

    dumpEnvironmentInfo();

    runSequence(
      "clean",
      ["html", "images", "fonts", "languages", "styles", "scripts"],
      "inject", done
    );
  });

  gulp.task("clean", () => del(["www/**"]));

  gulp.task("indexHtml", () => gulp
    .src("www/index.html")
    .pipe(g.htmlmin({ removeComments: true, collapseWhitespace: true }))
    .pipe(gulp.dest("www")));

  gulp.task("styles", () => {
    let pipe = gulp
      .src(paths.scssEntryPoint);

    if (!isDist) {
      pipe = pipe.pipe(g.sourcemaps.init());
    }

    pipe = pipe
      .pipe(g.sassGlob())
      .pipe(g.sass());

    if (!isDist) {
      // report sass error but don't make build fail
      pipe = pipe.on("error", g.notify.onError("Error: <%= error.message %>"));
    }

    if (!isDist) {
      pipe = pipe.pipe(g.sourcemaps.write());
    }

    if (isDist) {
      pipe = pipe.pipe(g.cleanCss({ keepSpecialComments: 0 }));
    }

    return pipe.pipe(gulp.dest("www/css/"));
  });

  gulp.task("html", () => {
    let pipe = gulp
      .src(paths.html);

    if (isDist) {
      pipe = pipe
        .pipe(g.htmlmin({ removeComments: true, collapseWhitespace: true }))
        .pipe(g.ngHtml2js({
          moduleName: "app",
          declareModule: false
        }))
        .pipe(g.rename({ extname: ".js" }));
    }

    return pipe.pipe(gulp.dest(`www${isDist ? "/app" : ""}`));
  });

  gulp.task("languages", () => gulp.src(paths.languages)
    .pipe(gulp.dest("www/language")));

  gulp.task("images", () => {
    let pipe = gulp.src(paths.images);
    if (isDist) {
      pipe = pipe.pipe(g.image({
        zopflipng: false,
        svgo: { disable: ["convertTransform"] }
      }));
    }
    return pipe.pipe(gulp.dest("www/img"));
  });

  gulp.task("fonts", () => gulp.src(paths.fonts)
    .pipe(gulp.dest("www/fonts")));

  gulp.task("scripts", ["js-app"], (done) => {
    done();
  });

  gulp.task("js-app", (done) => {
    runSequence("tsc", "js-config", "js-config-clean", done);
  });

  gulp.task("js-config", () => gulp.src(paths.getJsConfig())
    .pipe(g.rename("config.js"))
    .pipe(gulp.dest("www/app"))
  );

  gulp.task("js-config-clean", () =>
    // remove all unused configs from project
    del(paths.jsConfigFolder)
  );

  gulp.task("tsc", () => {
    let pipe = tsProject.src();

    if (!isDist) {
      pipe = pipe.pipe(g.sourcemaps.init());
    }
    pipe = pipe.pipe(tsProject(ts.reporter.longReporter()));

    if (isDist) {
      pipe = pipe.on("error", () => {
        process.exit(-2); // eslint-disable-line
      });
    } else {
      pipe = pipe.on("error", g.notify.onError("Error: <%= error.message %>"));
    }

    pipe = pipe.js;

    if (!isDist) {
      pipe = pipe.pipe(g.sourcemaps.write({ sourceRoot: "." }));
    }

    return pipe.pipe(gulp.dest("www/app"));
  });

  gulp.task("uglify", () => gulp.src("www/js/*.js")
    .pipe(g.uglify({ mangle: true }))
    .pipe(gulp.dest("www/js")));

  gulp.task("concat", ["concat:lib", "concat:app", "concat:legacy"], () => del([
    "www/lib/**",
    "www/app/**"
  ]));

  gulp.task("concat:legacy", () => gulp
    .src(helpers.generateLegacyMultimatch(), { cwd: "www" })
    .pipe(g.concat("legacy.js"))
    .pipe(gulp.dest("www/js")));

  gulp.task("concat:lib", () => gulp
    .src(helpers.generateLibMultimatch(paths), { cwd: "www" })
    .pipe(g.concat("lib.js"))
    .pipe(gulp.dest("www/js/")));

  gulp.task("concat:app", () => gulp
    .src(helpers.generateAppMultimatch(), { cwd: "www" })
    .pipe(g.concat("app.js"))
    .pipe(gulp.dest("www/js/")));

  gulp.task("move-index", () => gulp.src(paths.indexHtml)
    .pipe(gulp.dest("www")));

  gulp.task("inject", ["move-index"], () => gulp.src("index.html", { cwd: "www" })
    .pipe(g.inject(
      gulp.src(generateAppMultimatch(paths), { cwd: "www", read: false }),
      {
        relative: true,
        starttag: "<!-- app-js -->",
        removeTags: true,
        transform(filepath) {
          return `<script src='${filepath}'></script>\n`;
        }
      }
    ))
    .pipe(gulp.dest("www")));

  function getTsProject() {
    return ts.createProject("tsconfig.json");
  }

  function generateAppMultimatch() {
    return [
      "app/**/*.js",
      "!app/old-browser.js",
      "js/app.js"
    ];
  }

  function dumpEnvironmentInfo() {
    console.log("==== BUILD SYSTEM IS RUNNING WITH FOLLOWING SETTINGS ====");
    console.log(`PLATFORM      : ${global.platform}`);
    console.log(`ENVIRONMENT   : ${global.environment}`);
    console.log(`MODE          : ${global.mode}`);
    console.log(`RUNTIME_CONFIG: ${global.runtimeConfig}`);
  }
};
