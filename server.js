var express = require('express');
var app = express();

app.use(express.static('public'));

app.set('views', __dirname + '/views')
app.set('view engine', 'jade')


app.get('/', function (req, res) {
   res.sendFile( __dirname + "/" + "index.html");
})

app.get('/jade', function (req, res) {
   res.render('layout');
})

var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port

   console.log("Example app listening at http://%s:%s", host, port)
})
