var run = require('./config/run-config');
var gulp = require('gulp');
var gulpIf = require('gulp-if');
var gulpNewer = require('gulp-newer');
var gulpSourcemaps = require('gulp-sourcemaps');
var gulpConcat = require('gulp-concat');
var gulpUglify = require('gulp-uglify');
var gulpSize = require('gulp-size');
var gulpCache = require('gulp-cache');
var gulpSass = require('gulp-sass');
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

var SETUP = {
    AUTOPREFIXER_BROWSERS:[
        'ie >= 10',
        'ie_mob >= 10',
        'ff >= 30',
        'chrome >= 34',
        'safari >= 7',
        'opera >= 23',
        'ios >= 7',
        'android >= 4.4',
        'bb >= 10'
    ]
};

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
        .pipe(gulp.dest('dist/images'))
        .pipe(gulpSize({ title: 'images' }));
});

// Copy all files at the root level (app)
gulp.task('copy', function () {
    return gulp.src(['src/*', '!src/*.html'], {dot: true})
        .pipe(gulp.dest('dist'))
        .pipe(gulpSize({ title: 'copy' }));
});

// styles
(function(stylesTask){
    gulp.task('compile:styles:serve', stylesTask(run.styles.serve));
    gulp.task('compile:styles:build', stylesTask(run.styles.build));    
}(function(destPath){
    return function(){
        return gulp.src(run.styles.src)
        .pipe(plumber())
        .pipe(gulpNewer(destPath))
        .pipe(gulpSourcemaps.init())
        .pipe(gulpSass({outputStyle: 'compact'}).on('error', gulpSass.logError))
        .pipe(gulpAutoprefixer(SETUP.AUTOPREFIXER_BROWSERS))
        .pipe(gulpSourcemaps.write('/sourcemaps'))
        .pipe(gulp.dest(destPath))
        .pipe(gulpSize({ title: 'styles' }));
    };
}));

// scripts
(function(scriptsTask){
    gulp.task('compile:scripts:serve', scriptsTask(run.scripts.serve));
    gulp.task('compile:scripts:build', scriptsTask(run.scripts.build));
}(function(destPath){
    return function(){
        return gulp.src(run.scripts.src)
        .pipe(plumber())
        .pipe(gulpNewer(destPath))
        .pipe(gulpSourcemaps.init())
        .pipe(gulpUglify({ mangle: false }))
        .pipe(gulpSourcemaps.write('/sourcemaps'))
        .pipe(gulp.dest(destPath))
        .pipe(gulpSize({ title: 'scripts' }));
    };
}));

// ejs
(function(ejsTask){
    gulp.task('compile:ejs:serve', ejsTask(run.ejs.serve));
    gulp.task('compile:ejs:build', ejsTask(run.ejs.build));
}(function(destPath){
    return function() {
        return gulp.src(run.ejs.src)
        .pipe(plumber())
        .pipe(ejsMonster(run.ejs.data,run.ejs.options))
        .pipe(gulp.dest(destPath));
    };
}));

gulp.task('ejs:reload',['compile:ejs:serve'],function(cb){
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

gulp.task('clean:all', function(){
    return del([run.serve, run.build]);
});

// Clean output directory
gulp.task('clean', function () {
    return del([run.serve, run.build, '!dist/.git'], { dot: true });
});

// Watch files for changes & reload
gulp.task('serve', ['compile:ejs:serve', 'compile:scripts:serve', 'compile:styles:serve'], function () {
    
    var browserSyncConfig = {
        notify: false,
        logPrefix: 'BS',
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
        
        
        var proxyConfig = {
            target: 'http://localhost:' + run.server.port,
            pathRewrite: {},
            changeOrigin: true,
            logLevel: 'debug'
        };
        
        proxyConfig.pathRewrite['^' + run.server.apiPath] = '/';
        
        browserSyncConfig.server.middleware = [proxy(run.server.apiPath,proxyConfig)];
    }
    
    browserSync(browserSyncConfig);
    
    gulp.watch(['src/**/*.html'], reload);
    gulp.watch(['src/styles/**/*.{scss,css}'], ['compile:styles:serve', reload]);
    gulp.watch(['src/scripts/**/*.js'], ['compile:scripts:serve', reload]);
    gulp.watch(['src/images/**/*'], reload);
    gulp.watch('src/**/*.ejs', ['ejs:reload']);
});

// Build production files, the default task
gulp.task('build', ['clean'], function (cb) {
  runSequence(['compile:styles:build', 'compile:ejs:build', 'compile:scripts:build', 'copy'], cb);
});

// Build and serve the output from the dist build
gulp.task('serve:build', ['build'], function () {
    browserSync({
        notify: false,
        logPrefix: 'SB',
        startPath:run.serveStartPath,
        // Run as an https by uncommenting 'https: true' Note: this uses an unsigned certificate which on first access will present a certificate warning in the browser.
        // https: true,
        server:  {
            baseDir: 'build',
            port: run.servePort
        }
    });
});

gulp.task('default', ['serve']);