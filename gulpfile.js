var gulptask = require('./config/gulptask');
var gulppath = require('./config/gulppath');

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

// Lint JavaScript
gulp.task('lint', function () {
    return gulp.src(['src/scripts/**/*.js', '!node_modules/**'])
        .pipe(gulpEslint())
        .pipe(gulpEslint.format())
        .pipe(gulpIf(!browserSync.active, gulpEslint.failAfterError()));
});

// styles
(function(stylesTask){
    gulp.task('compile:styles:serve', stylesTask(gulppath.styles.serve));
    gulp.task('compile:styles:build', stylesTask(gulppath.styles.build));    
}(function(destPath){
    return function(){
        return gulp.src(gulppath.styles.src)
        .pipe(plumber())
        .pipe(gulpNewer(destPath))
        .pipe(gulpSourcemaps.init())
        .pipe(gulpSass({outputStyle: 'compact'}).on('error', gulpSass.logError))
        .pipe(gulpAutoprefixer(gulptask.autoprefixer))
        .pipe(gulpSourcemaps.write('/sourcemaps'))
        .pipe(gulp.dest(destPath))
        .pipe(gulpSize({ title: 'styles' }));
    };
}));

// scripts
(function(scriptsTask){
    gulp.task('compile:scripts:serve', scriptsTask(gulppath.scripts.serve));
    gulp.task('compile:scripts:build', scriptsTask(gulppath.scripts.build));
}(function(destPath){
    return function(){
        return gulp.src(gulppath.scripts.src)
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
    gulp.task('compile:ejs:serve', ejsTask(gulppath.ejs.serve));
    gulp.task('compile:ejs:build', ejsTask(gulppath.ejs.build));
}(function(destPath){
    return function() {
        return gulp.src(gulppath.ejs.src)
        .pipe(plumber())
        .pipe(ejsMonster(gulppath.ejs.data,gulppath.ejs.options))
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
    return del([gulppath.serve, gulppath.build]);
});

// Clean output directory
gulp.task('clean', function () {
    return del([gulppath.serve, gulppath.build, '!dist/.git'], { dot: true });
});

// Watch files for changes & reload
gulp.task('serve', ['compile:ejs:serve', 'compile:scripts:serve', 'compile:styles:serve'], function () {
    
    var browserSyncConfig = {
        notify: false,
        logPrefix: 'BS',
        startPath:gulppath.serveStartPath,
        server: {
            baseDir: gulppath.serve,
            port: gulppath.servePort
        }
    };
    
    //temporary api server
    if(gulptask.server.bootOnServe){
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
            target: 'http://localhost:' + gulptask.server.port,
            pathRewrite: {},
            changeOrigin: true,
            logLevel: 'debug'
        };
        
        proxyConfig.pathRewrite['^' + gulptask.server.apiPath] = '/';
        
        browserSyncConfig.server.middleware = [proxy(gulptask.server.apiPath,proxyConfig)];
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
  runSequence(['compile:styles:build', 'compile:ejs:build', 'compile:scripts:build'], cb);
});

// Build and serve the output from the dist build
gulp.task('serve:build', ['build'], function () {
    browserSync({
        notify: false,
        logPrefix: 'SB',
        startPath:gulppath.serveStartPath,
        // Run as an https by uncommenting 'https: true' Note: this uses an unsigned certificate which on first access will present a certificate warning in the browser.
        // https: true,
        server:  {
            baseDir: 'build',
            port: gulppath.servePort
        }
    });
});

gulp.task('default', ['serve']);