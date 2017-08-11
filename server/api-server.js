// This should only be used when you need a temporary server.
var http  = require("./runs/express.js");
var adapt = require("./runs/json-database.js");
var _     = require("lodash");

//Home
http.get('/', function(req, res){
    res.send('ok');
});

//simple sudo db
http.get('/db/:name', function(req, res){
    var db = adapt(req.params.name);
    res.send(db.get());
});

http.get('/db/:name/put/:path', function(req, res){
    var db = adapt(req.params.name);
    db.put(req.params.path, req.query).save();
    res.redirect(`/db/${req.params.name}`);
});

//404 error
http.use(function (req, res, next) {
    var err = new Error(`Not Found [${req.method}] ${req.url}`);
    err.status = 404;
    next(err);
});