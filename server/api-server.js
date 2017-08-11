// This should only be used when you need a temporary server.
var http = require("./runs/express.js");

//Home
http.get('/', function(req, res){
    res.send('ok');
});

http.get('/foo', function(req, res){
    res.send('foo');
});

http.get('/bar', function(req, res){
    res.send('bar');
});