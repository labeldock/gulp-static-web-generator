var run = require('./config/run-config');

var gulp = require('gulp');
var gulpIf = require('gulp-if');
var gulpNewer = require('gulp-newer');
var gulpSourcemaps = require('gulp-sourcemaps');
var gulpConcat = require('gulp-concat');
var gulpUglify = require('gulp-uglify');
var gulpSize = require('gulp-size');
var gulpCache = require('gulp-cache');
var gulpImagemin = require('gulp-imagemin');
var gulpSass = require('gulp-sass');
var gulpCssnano = require('gulp-cssnano');
var gulpAutoprefixer = require('gulp-autoprefixer');
var gulpUseref = require('gulp-useref');
var gulpEslint = require('gulp-eslint');
var gulpHtmlmin = require('gulp-htmlmin');

var plumber = require('gulp-plumber');
var ejsMonster = require('gulp-ejs-monster');

var runSequence = require('run-sequence');
var browserSync = require('browser-sync');

var del = require('del');
var reload = browserSync.reload;

// Lint JavaScript
gulp.task('lint', function () {
    return gulp.src(['src/scripts/**/*.js', '!node_modules/**'])
        .pipe(gulpEslint())
        .pipe(gulpEslint.format())
        .pipe(gulpIf(!browserSync.active, gulpEslint.failAfterError()));
});

// Optimize images
gulp.task('images', function () {
    return gulp.src('src/images/**/*')
        .pipe(gulpCache(gulpImagemin({progressive: true,interlaced: true})))
        .pipe(gulp.dest('dist/images'))
        .pipe(gulpSize({ title: 'images' }));
});

// Copy all files at the root level (app)
gulp.task('copy', function () {
    return gulp.src(['src/*', '!src/*.html'], {dot: true})
        .pipe(gulp.dest('dist'))
        .pipe(gulpSize({ title: 'copy' }));
});

// Compile and automatically prefix stylesheets
gulp.task('styles', function () {
    var AUTOPREFIXER_BROWSERS = [
        'ie >= 10',
        'ie_mob >= 10',
        'ff >= 30',
        'chrome >= 34',
        'safari >= 7',
        'opera >= 23',
        'ios >= 7',
        'android >= 4.4',
        'bb >= 10'
    ];

    // For best performance, don't add Sass partials to `gulp.src`
    return gulp.src(run.styles.src)
        .pipe(gulpNewer(run.styles.serve))
        .pipe(gulpSourcemaps.init())
        .pipe(gulpSass({precision: 10})
            .on('error', gulpSass.logError))
        .pipe(gulpAutoprefixer(AUTOPREFIXER_BROWSERS))
        .pipe(gulp.dest(run.styles.serve))
        .pipe(gulpIf('*.css', gulpCssnano()))
        .pipe(gulpSize({ title: 'styles' }))
        .pipe(gulpSourcemaps.write('./'))
        .pipe(gulp.dest(run.styles.build))
        .pipe(gulp.dest(run.styles.serve));
});

gulp.task('scripts', function () {
    // Note: Since we are not using useref in the scripts build pipeline,
    //       you need to explicitly list your scripts here in the right order
    //       to be correctly concatenated
    return gulp.src(run.scripts.src)
        .pipe(gulpNewer(run.scripts.serve))
        .pipe(gulpSourcemaps.init())
        .pipe(gulp.dest(run.styles.serve))
        .pipe(gulpConcat('main.min.js'))
        .pipe(gulpUglify({ preserveComments: 'some' }))
        .pipe(gulpSize({ title: 'scripts' }))
        .pipe(gulpSourcemaps.write('.'))
        .pipe(gulp.dest(run.scripts.build))
        .pipe(gulp.dest(run.scripts.serve));
});

gulp.task('ejs', function() {
    return gulp.src(run.ejs.src)
        .pipe(plumber())
        .pipe(ejsMonster(run.ejs.data,run.ejs.options))
        .pipe(gulp.dest(run.ejs.build))
        .pipe(gulp.dest(run.ejs.serve));
});


gulp.task('ejs:reload',['ejs'],function(cb){
    reload(),cb();
});


// Scan your HTML for assets & optimize them  
gulp.task('html', function () {
    return gulp.src('src/**/*.html')
    .pipe(gulpUseref({searchPath: '{.tmp,app}',noAssets: true}))
    .pipe(gulpIf('*.html', gulpHtmlmin({
        removeComments: true,
        collapseWhitespace: true,
        collapseBooleanAttributes: true,
        removeAttributeQuotes: true,
        removeRedundantAttributes: true,
        removeEmptyAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        removeOptionalTags: true
        }))
    )
    .pipe(gulpIf('*.html', gulpSize({ title: 'html', showFiles: true })))
    .pipe(gulp.dest('dist'));
});

// Clean output directory
gulp.task('clean', function () {
    del([run.serve, run.build, '!dist/.git'], { dot: true });
});

// Watch files for changes & reload
gulp.task('serve', ['ejs', 'scripts', 'styles'], function () {
    
    var browserSyncConfig = {
        notify: false,
        logPrefix: 'BS',
        scrollElementMapping: ['main', '.mdl-layout'],
        startPath:run.serveStartPath,
        server: {
            baseDir: run.serve,
            port: run.servePort
        }
    };
    
    //temporary api server
    if(run.server.bootOnServe){
        var nodemon = require('nodemon');
        var proxy   = require('http-proxy-middleware');
        
        nodemon({
            script: 'server/api-server.js',
            ignore: ['./config','./builid','./src','./.tmp'],
            ext: 'js',
            stdout: false
        }).on('readable', function () {
            this.stdout.pipe(process.stdout);
            this.stderr.pipe(process.stderr);
        });
        
        browserSyncConfig.server.middleware = [
            proxy('/api',{
                target: 'http://localhost:' + run.server.port,
                pathRewrite: {'^/api' : '/'},
                changeOrigin: true,
                logLevel: 'debug'
            })
        ];
    }
    
    browserSync(browserSyncConfig);
    
    gulp.watch(['src/**/*.html'], reload);
    gulp.watch(['src/styles/**/*.{scss,css}'], ['styles', reload]);
    gulp.watch(['src/scripts/**/*.js'], ['scripts', reload]);
    gulp.watch(['src/images/**/*'], reload);
    gulp.watch('src/**/*.ejs', ['ejs:reload']);

});

// Build and serve the output from the dist build
gulp.task('serve:dist', ['default'], function () {
    browserSync({
        notify: false,
        logPrefix: 'BS',
        scrollElementMapping: ['main', '.mdl-layout'],
        // Run as an https by uncommenting 'https: true' Note: this uses an unsigned certificate which on first access will present a certificate warning in the browser.
        // https: true,
        server: 'dist',
        port: 3001
    });
});

// Build production files, the default task
gulp.task('build', ['clean'], function (cb) {
  runSequence('styles', ['html', 'scripts', 'ejs', 'images', 'copy'], cb);
});

gulp.task('default', ['serve']);