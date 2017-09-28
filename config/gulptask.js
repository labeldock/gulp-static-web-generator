(function(define){
    
    define({
        server: {
            bootOnServe:true,
            port:7890,
            apiPath:"/api"
        },
        autoprefixer:[
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
    });
    
}(function(d){module.exports=d;}));