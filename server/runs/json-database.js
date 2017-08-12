(function(define){
    var fs = require('fs');
    var _  = require('lodash');
    
    var JSONDatabase = (function(name){
        
        var JSONDatabase = function(name){
            this.database = name;
            this.path  = `./server/db/${this.database}.json`;
            this.data  = null;
            this.load();
        };
        
        var JSONQuery = function(dbcontroller,path){
            this.dbcontroller = dbcontroller;
            
            if(!path) path = '';
            
            if(_.isArray(path)){
                this.singlePath = false;
                this.pathes     = path;
            } else {
                this.singlePath = true;
                this.pathes     = [path];
            }
        };
        
        JSONQuery.prototype = {
            load:function(){ return this.dbcontroller.load(), this; },
            save:function(){ 
                console.log("db data save before",this.dbcontroller.data);
                return this.dbcontroller.save(), this;
            },
            select:function(){ return new JSONQuery(this.dbcontroller, this.pathes); },
            trace:function(){ return console.log(this), this; },
            get:function(){
                var path = this.pathes;
                var data = this.dbcontroller.data;
                
                if(this.singlePath){
                    return !path[0] ? data : _.get(data,path[0]);
                } else {
                    return _.map(path,function(path){
                        return !path ? data : _.get(data,path);
                    });
                }
            },
            set:function(value){
                var path = this.pathes;
                var data = this.dbcontroller.data;
                
                if(this.singlePath){
                    _.set(data,path[0],value);
                } else {
                    _.each(path,function(path){
                        _.set(data,path,value);
                    });
                };
                return this;
            }
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
            select:function(path){
                return new JSONQuery(this,path);
            }
        };
        
        return JSONDatabase;
    }());
    
    var keepAliveDatabase = {};
    
    define(function(name){
        if(keepAliveDatabase[name]){
            return keepAliveDatabase[name];
        } else {
            return keepAliveDatabase[name] = new JSONDatabase(name);
        }
    });
}(function(def){if(def)module.exports = def; return module.exports;}))