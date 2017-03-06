var express = require('express');
var app = express();

app.use(express.static('public'));

app.set('views', __dirname + '/views')
app.set('view engine', 'jade')


app.get('/', function (req, res) {
  res.sendFile( __dirname + "/" + "index.html");
})

var currentStandings = {
    /*
    team: played, won, lost, points
    */
    teamA: ['5', '3', '2', '3'],
    teamB: ['4', '2', '2', '3']
};

var data = {
    games: [
    {
      gameDate: '03/04/2017',
      gameTitle: 'Team A vs Team B',
      gameInfo: 'This is the info'
    },
    {
      gameDate: '06/10/2017',
      gameTitle: 'Team C vs Team D',
      gameInfo: 'This is the info'
    }]
};

app.get('/jade', function (req, res) {
  res.render('layout', { test: JSON.stringify(data), standings:  JSON.stringify(currentStandings)} );
})

var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port

   console.log("Example app listening at http://%s:%s", host, port)
})
