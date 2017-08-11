(function(define){
    var fs = require('fs');
    var _  = require('lodash');
    
    var JSONDatabase = (function(name){
        var JSONDatabase = function(name){
            this.database = name;
            this.path  = `./db/${this.database}.json`;
            this.data  = null;
            this.load();
        };
        
        JSONDatabase.prototype = {
            load:function(){
                try {
                    this.data = fs.readFileSync(this.path,'utf8');
                } catch(e) {
                    console.log(`Create database '${this.database}'`);;
                    this.data = {};
                    this.save();
                }
                return this.data;
            },
            save:function(){
                return this.data ? (fs.writeFileSync(this.path,this.data || {}), true) : false;
            },
            get:function(path){
                return !path ? this.data : _.get(this.data,path);
            },
            put:function(path,value){
                if(this.data && typeof path === "string" && path) {
                    _.set(this.data, path, value);
                }
                return this;
            }
        };
        
        return JSONDatabase;
    }());
    
    define(function(name){
        return new JSONDatabase(name);
    });
}(function(def){if(def)module.exports = def; return module.exports;}))