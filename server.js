var express = require('express');
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/test1');

app.use(express.static('public'));
// Make our db accessible to our router
app.use(function(req,res,next){
    req.db = db;
    next();
});

app.set('views', __dirname + '/views')
app.set('view engine', 'jade')


app.get('/', function (req, res) {
  res.sendFile( __dirname + "/" + "index.html");
})

app.get('/game_entry', function (req, res) {
  res.render('game_entry');
})

/* POST to Add User Service */
app.post('/addgame', function(req, res) {
  // Set our internal DB variable
  var db = req.db;

  // Get our form values. These rely on the "name" attributes
  var matchID = req.body.matchID;
  var played = req.body.played;
  var team1 = req.body.team1;
  var team2 = req.body.team2;
  var winner = req.body.winner;

  // Set our collection
  var collection = db.get('games');

  // Submit to the DB
  collection.insert({
      "matchID": matchID,
      "team1" : team1,
      "team2" : team2,
      "winner": winner,
      "played": played,
      "season": "1"
  }, function (err, doc) {
      if (err) {
          // If it failed, return error
          res.send("There was a problem adding the information to the database.");
      }
      else {
          // And forward to success page
          res.redirect("/jade");
      }
  });
});

app.get('/jade', function (req, res) {
  var db = req.db;
  var collection = db.get('games');
  collection.find({},{},function(e,docs) {
    var teamStats = {
      "won" : { "Team A": 0,
                "Team B": 0,
                "Team C": 0,
                "Team D": 0,
              },
      "played" : { "Team A": 0,
                 "Team B": 0,
                 "Team C": 0,
                 "Team D": 0,
               }
    }
    for (var game in docs) {
      var teamPositions = { "first" : "Team A", "second" : "Team B", "third" : "Team C", "fourth" : "Team D" }
      teamStats.played[docs[game].team1] += 1;
      teamStats.played[docs[game].team2] += 1;
      teamStats.won[docs[game].winner] += 1;
    }
    console.log("Team Stats: " + JSON.stringify(teamStats));
    res.render('layout', { games : JSON.stringify(docs), teamStats: teamStats, teamPositions: teamPositions } );
  });
})

var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port

   console.log("Example app listening at http://%s:%s", host, port)
})
