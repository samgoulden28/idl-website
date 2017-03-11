var config = require('./config');
var express = require('express');
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var mongo = require('mongodb');
var ObjectId = require("mongodb").ObjectID;
var monk = require('monk');
var db = monk(config.mongodb.host + ':' + config.mongodb.port + '/' + config.mongodb.db_name);

app.use(express.static('public'));

// Make our db accessible to our router
app.use(function(req,res,next){
    req.db = db;
    next();
});

app.set('views', __dirname + '/views')
app.set('view engine', 'jade')

var teams = [ "Team A", "Team B", "Team C", "Team D" ];

function passwordCorrect(given_password) {
  return given_password === config.access.password;
}

app.get('/game_entry', function (req, res) {
  res.render('game_entry');
})

app.get('/game_edit', function (req, res) {
  var db = req.db;
  var collection = db.get('games');
  collection.find({},{},function(e,docs) {
    res.render('game_edit', { games: docs } );
  });
})

app.post('/editgame', function (req, res) {
  var db = req.db;

  //Check the user has provided the correct password
  var password = req.body.password;
  // Get our game ID to delete values.
  var gameID = req.body.gameID;

  var collection = db.get('games');

  // Submit to the DB
  collection.findOne({"_id": ObjectId(req.body.gameID)}, {},  function (err, doc) {
      if (err) {
          // If it failed, return error
          res.send("There was a problem getting the game from the database.");
      }
      else {
          console.log("Game " + gameID + " deleted");
          // Render the edit page
          res.render("game_edit2", { game: doc, teams: teams });
      }
  });
})

app.post('/do_editgame', function (req, res) {
  var db = req.db;

  //Check the user has provided the correct password
  var password = req.body.password;

  if (!passwordCorrect(password)) {
    res.send("Incorrect password supplied.");
  } else {
    // Get our game ID to update values.
    var gameID = req.body.gameID;

    // Get our form values. These rely on the "name" attributes
    var matchID = req.body.matchID;
    var played = req.body.played;
    var team1 = req.body.team1;
    var team2 = req.body.team2;
    var winner = req.body.winner;
    var game_no = req.body.game_no;
    var game_total = req.body.game_total;

    var collection = db.get('games');

    // Update the record in the DB
    collection.update({"_id": ObjectId(req.body.gameID)},
    {
        "game_no": game_no,
        "game_total": game_total,
        "matchID": matchID,
        "team1" : team1,
        "team2" : team2,
        "winner": winner,
        "played": played,
    },  function (err, doc) {
        if (err) {
            // If it failed, return error
            res.send("There was a problem updating the game to the database.");
        }
        else {
            console.log("Game " + gameID + " updated");
            // Render the edit page
            res.redirect("/");
        }
    });
  }
})

app.get('/game_delete', function (req, res) {
  var db = req.db;
  var collection = db.get('games');
  collection.find({},{},function(e,docs) {
    res.render('game_delete', { games: docs } );
  });
})

app.post('/deletegame', function (req, res) {
  var db = req.db;

  //Check the user has provided the correct password
  var password = req.body.password;

  if (!passwordCorrect(password)) {
    res.send("Incorrect password supplied.");
  } else {
    // Get our game ID to delete values.
    var gameID = req.body.gameID;

    var collection = db.get('games');

    // Submit to the DB
    collection.remove({"_id": ObjectId(req.body.gameID)} , function (err, doc) {
        if (err) {
            // If it failed, return error
            res.send("There was a problem deleting the game from the database.");
        }
        else {
            console.log("Game " + gameID + " deleted");
            // And forward to success page
            res.redirect("/");
        }
    });
  }
})

/* POST to Add User Service */
app.post('/addgame', function(req, res) {
  // Set our internal DB variable
  var db = req.db;

  //Check the user has provided the correct password
  var password = req.body.password;

  if (!passwordCorrect(password)) {
    res.send("Incorrect password supplied.");
  } else {

    // Get our form values. These rely on the "name" attributes
    var matchID = req.body.matchID;
    var played = req.body.played;
    var team1 = req.body.team1;
    var team2 = req.body.team2;
    var winner = req.body.winner;
    var game_no = req.body.game_no;
    var game_total = req.body.game_total;

    // Set our collection
    var collection = db.get('games');

    // Submit to the DB
    collection.insert({
        "game_no": game_no,
        "game_total": game_total,
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
            res.redirect("/");
        }
    });
  }
});

app.get('/', function (req, res) {
  var db = req.db;
  var collection = db.get('games');
  collection.find({}, {"sort" : [['played', 'desc']]}, function(e,docs) {
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
      teamStats.played[docs[game].team1] += 1;
      teamStats.played[docs[game].team2] += 1;
      teamStats.won[docs[game].winner] += 1;
    }
    var teamPositions = [ "Team A", "Team B", "Team C", "Team D" ];
    do {
        swapped = false;
        for (var i=0; i < teamPositions.length-1; i++) {
            if (teamStats.won[teamPositions[i]] < teamStats.won[teamPositions[i+1]]) {
                var temp = teamPositions[i];
                teamPositions[i] = teamPositions[i+1];
                teamPositions[i+1] = temp;
                swapped = true;
            }
        }
    } while (swapped);
    console.log("Team Stats: " + JSON.stringify(teamStats) + "Positions: " + teamPositions);
    res.render('index', { games : JSON.stringify(docs), teamStats: teamStats, teamPositions: teamPositions, onloadfunction: 'printGamesFromJSON()'} );
  });
})

var server = app.listen(config.web.port, function () {
   var host = server.address().address
   var port = server.address().port

   console.log("Example app listening at http://%s:%s", host, port)
})
