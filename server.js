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

var teams_collection = db.get('teams');
var seasons_collection = db.get('seasons');
var teams;
update_teams();

function update_teams() {
  teams_collection.find({},{},function(e,docs) {
    if (e) {
      // If it failed, return error
      console.log(e + ": There was a problem getting the teams from the database.");
    }
    else {
      console.log("Found teams: " + docs);
      teams = docs;
    }
  });
}

function get_season(season_number) {
  var season;
  seasons_collection.findOne({"season_number": season_number},{},function(e,doc) {
    if (e) {
      // If it failed, return error
      console.log(e + ": There was a problem getting the seasons from the database.");
    }
    else {
      console.log("Found season: " + JSON.stringify(doc));
      season = doc;
    }
  });
  return season;
}

get_season(config.season);

// global_collection.find({"season": "1"}, {},  function (err, docs) {
//     if (err) {
//         // If it failed, return error
//         console.log("There was a problem getting the teams from the database.");
//     }
//     else {
//       console.log("Found teams: " + docs);
//       teams = docs.toArray();
//     }
// });

//teams = [ "Team A", "Team B", "Team C", "Team D" ];

function passwordCorrect(given_password) {
  return given_password === config.access.password;
}

app.get('/view_game', function (req, res) {
  console.log(req.query.id);
  var id = req.query.id;
  var collection = db.get('games');
  // Submit to the DB
  collection.findOne({"matchID": id}, {},  function (err, doc) {
      if (err) {
          // If it failed, return error
          res.send("There was a problem getting the game from the database.");
      }
      else {
          console.log("Found match: " + id);
          // Render the edit page
          res.render('view_game', { game: doc });
      }
  });
})

app.get('/game_entry', function (req, res) {
  res.render('game_entry', { teams: teams, season: season});
})

app.get('/team_entry', function (req, res) {
  res.render('team_entry');
})

app.get('/game_edit', function (req, res) {
  var db = req.db;
  var collection = db.get('games');
  collection.find({},{},function(e,docs) {
    res.render('game_edit', { games: docs } );
  });
})

app.post('/addteam', function (req, res) {
  var db = req.db;

  //Check the user has provided the correct password
  var password = req.body.password;

  if (!passwordCorrect(password)) {
    res.send("Incorrect password supplied.");
  } else {
    // Get our game ID to delete values.
    var team_name = req.body.team_name;
    var player1 = req.body.player1;
    var player1_profile = req.body.player1_profile;
    var player2 = req.body.player2;
    var player2_profile = req.body.player2_profile;
    var player3 = req.body.player3;
    var player3_profile = req.body.player3_profile;
    var player4 = req.body.player4;
    var player4_profile = req.body.player4_profile;
    var player5 = req.body.player5;
    var player5_profile = req.body.player5_profile;
    var season = req.body.season;

    var collection = db.get('teams');

    // Update the record in the DB
    collection.insert({
        "team_name": team_name,
        "players" : { "player1": { "name" : player1, "steam_profile" : player1_profile },
                      "player2": { "name" : player2, "steam_profile" : player2_profile },
                      "player3": { "name" : player3, "steam_profile" : player3_profile },
                      "player4": { "name" : player4, "steam_profile" : player4_profile },
                      "player5": { "name" : player5, "steam_profile" : player5_profile }
                    },
        "season" : season
    },  function (err, doc) {
        if (err) {
            // If it failed, return error
            res.send("There was a problem adding the team to the database.");
        }
        else {
            console.log("Team " + team_name + " added");
            update_teams();
            // Render the edit page
            res.redirect("/");
        }
    });
  }
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
          console.log("Game " + req.body.gameID + " deleted");
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
    var youtube_embed = req.body.youtube_embed;

    var collection = db.get('games');

    var msec = Date.parse(played);
    var d = new Date(msec);

    // Update the record in the DB
    collection.update({"_id": ObjectId(req.body.gameID)},
    {
        "game_no": game_no,
        "game_total": game_total,
        "matchID": matchID,
        "team1" : team1,
        "team2" : team2,
        "winner": winner,
        "played": d,
        "youtube_embed": youtube_embed
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
    var season = req.body.season;


    // Set our collection
    var collection = db.get('games');

    var msec = Date.parse(played);
    var d = new Date(msec);
    // Submit to the DB
    collection.insert({
        "game_no": game_no,
        "game_total": game_total,
        "matchID": matchID,
        "team1" : team1,
        "team2" : team2,
        "winner": winner,
        "played": new Date(d),
        "season": season
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

app.get('/teams', function (req, res) {
  var db = req.db;
  var collection = db.get('teams');
  collection.find({}, {}, function(e,docs) {
    console.log(docs);
    res.render('teams', { "teams": docs });
  });
})

app.get('/', function (req, res) {
  //Get the list of games
  var db = req.db;
  var collection = db.get('games');
  //Sort on match ID (they are in chronological order)
  collection.find({"season" : config.season}, {"sort": { "matchID": -1 } }, function(e,docs) {
    var teamStats = {};
    teamStats['won'] = {};
    teamStats['played'] = {};
    var teamPositions = [];
    //Populate teams stats objects
    for (var team in teams) {
      console.log ("TEAM: " + team)
      teamStats['won'][teams[team].team_name] = 0;
      teamStats['played'][teams[team].team_name] = 0;
      teamPositions.push(teams[team].team_name);
    }
    //Add scores to teams depending on database of games.
    for (var game in docs) {
      teamStats['played'][docs[game].team1] += 1;
      teamStats['played'][docs[game].team2] += 1;
      teamStats['won'][docs[game].winner] += 1;
    }
    //Sort teams based on points won.
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
    res.render('index', { games : docs, teamStats: teamStats, teamPositions: teamPositions, season: season, teams: teams } );
  });
})

var server = app.listen(config.web.port, function () {
   var host = server.address().address
   var port = server.address().port

   console.log("Example app listening at http://%s:%s", host, port)
})
