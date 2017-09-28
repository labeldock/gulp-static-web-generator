(function(define){
    
    var ejsConfig = require('./ejs.js');
    
    var build = 'build';
    var src   = 'src';
    var serve = '.tmp';
    var main  = src + '/main';
    
    define({
        build: build,
        src: src,
        main: main,
        
        serve: serve,
        servePort: 3000,
        serveStartPath:'/',

        ejs: {
            src: [
                main + '/**/*.ejs',
                '!' + main + '/**/_*.ejs'
            ],
            build: build,
            serve: serve,
            data: ejsConfig,
            options: {ext:'.html',layouts:'./'+src+'/layouts'}
        },
        
        styles:{
            src:[
                'src/styles/**/*.scss', 
                'src/styles/**/*.css'
            ],
            build: build + '/assets',
            serve: serve + '/assets'
        },
        
        scripts:{
            src:[
                './src/scripts/libs/*',
                './src/scripts/*'
            ],
            build: build + '/assets',
            serve: serve + '/assets'
        },
        
        image: {
            src: src + '/images/**/*.+(jpg|jpeg|png|gif|svg)',
            build: build + '/image',
            imageminOptions: {
                optimizationLevel: 8
            }
        }
    });
    
}(function(d){module.exports=d;}));