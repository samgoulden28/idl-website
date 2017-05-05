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


function get_teams(callback) {
  teams_collection.find({ "season" : config.season },{},function(e,docs) {
    if (e) {
      // If it failed, return error
      console.log(e + ": There was a problem getting the teams from the database.");
    }
    else {
      console.log("Found teams: " + docs);
      callback(e, docs);
    }
  });
}

function get_season(callback) {
  seasons_collection.findOne({ "season_number" : config.season },{},function(e,doc) {
    if (e) {
      // If it failed, return error
      console.log(e + ": There was a problem getting the seasons from the database.");
    }
    else {
      console.log("Looking for season " + config.season + ". Found season: " + JSON.stringify(doc));
      callback(e, doc);
    }
  });
}


function passwordCorrect(given_password) {
  return given_password === config.access.password;
}

app.get('/fixture_entry_season_select', function (req, res) {
  res.render('fixture_entry_season_select', { season: config.season });
})


app.get('/fixture_entry', function (req, res) {
  get_teams(function(err, teams) {
    season = (req.query.season == null) ? config.season : req.query.season;
    res.render('fixture_entry', { teams: teams, season: season});
  });
})

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

app.get('/game_entry_fixture_select', function (req, res) {
  //Get the list of games
  var db = req.db;
  var fixtures_collection = db.get('fixtures');
  //Sort on match ID (they are in chronological order)
  fixtures_collection.find({"season" : config.season}, {"sort": { "date": -1 } }, function(e,docs) {
    res.render('game_entry_fixture_select', { fixtures: docs, season: config.season });
  })
})

app.get('/game_entry', function (req, res) {
    fixture_id = req.query.fixture;
    if(fixture_id == null) {
      res.redirect('/error');
    } else {
      var db = req.db;
      var fixtures_collection = db.get('fixtures');
      //Sort on match ID (they are in chronological order)
      fixtures_collection.findOne({"_id" : ObjectId(fixture_id)}, function(e,doc) {
        res.render('game_entry', { fixture: doc });
      })
    }
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
          var teams = get_teams();
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
  collection.find({"season" : config.season},{},function(e,docs) {
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
app.post('/addfixture', function(req, res) {
  // Set our internal DB variable
  var db = req.db;

  //Check the user has provided the correct password
  var password = req.body.password;

  if (!passwordCorrect(password)) {
    res.send("Incorrect password supplied.");
  } else {

    // Get our form values. These rely on the "name" attributes
    var season = req.body.season;
    var best_of = req.body.best_of;
    var team1 = req.body.team1;
    var team2 = req.body.team2;
    var date = req.body.date;
    // Set our collection
    var collection = db.get('fixtures');

    var msec = Date.parse(date);
    var d = new Date(msec);
    // Submit to the DB
    collection.insert({ "date" : d,
                        "best_of" : best_of,
                        "team1" : team1,
                        "team2" : team2,
                        "winner": "",
                        "played" : false,
                        "season" : season,
                        "games" : []}
                      , function (err, doc) {
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
    var fixture = JSON.parse(req.body.fixture.replace(/&quot;/g, '\\"'));
    var matchID = req.body.matchID;
    var played = req.body.played;
    var winner = req.body.winner;
    var game_no = req.body.game_no;
    // Set our collection
    var collection = db.get('fixtures');

    var msec = Date.parse(played);
    var d = new Date(msec);
    // Submit to the DB
    collection.update({
        "_id": fixture._id,
      },
      { $push: {"games": {
        "game_no": game_no,
        "matchID": matchID,
        "winner": winner,
        "played": new Date(d)
      }}}, function (err, doc) {
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
    res.render('teams', { "teams": JSON.stringify(docs), "season": config.season });
  });
})

app.get('/error', function (req, res) {
  res.send("Something went wrong. Go back to the home page here: <a href=\"/\"> Go home </a>");
})

app.get('/fixtures', function (req, res) {
  var db = req.db;
  var collection = db.get('fixtures');
  collection.find({"date" : { $gte : new Date()}},function(e,docs) {
    console.log("Found fixtures: " + docs + " after date: " + new Date())
    res.render('fixtures', { fixtures: docs } );
  });
})

app.get('/', function (req, res) {
  //Get the list of games
  var db = req.db;
  var fixtures_collection = db.get('fixtures');
  //Sort on match ID (they are in chronological order)
  fixtures_collection.find({"season" : config.season, "played": true }, {"sort": { "date": -1 } }, function(e,docs) {
    var fixtures = docs;
    get_season(function(err, season) {
      if(!season) {
        console.log("Found no season info for season " + config.season)
      }
      get_teams(function(err, teams) {
        if(!teams) {
          console.log("Found no teams for season " + config.season)
        }
        var teamStats = {};
        teamStats['won'] = {};
        teamStats['played'] = {};
        var teamPositions = [];
        //Populate teams stats objects
        for (var team in teams) {
          teamStats['won'][teams[team].team_name] = 0;
          teamStats['played'][teams[team].team_name] = 0;
          teamPositions.push(teams[team].team_name);
        }
        //Add scores to teams depending on database of games.
        for (var fixture in fixtures) {
          for (var game in fixtures[fixture]) {
            teamStats['played'][fixtures[fixture][game].team1] += 1;
            teamStats['played'][fixtures[fixture][game].team2] += 1;
            teamStats['won'][fixtures[fixture][game].winner] += 1;
          }
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
        res.render('index', { fixtures: fixtures, teamStats: teamStats, teamPositions: teamPositions, season: season, teams: teams } );
      });
    });
  });
})

var server = app.listen(config.web.port, function () {
   var host = server.address().address
   var port = server.address().port

   console.log("Example app listening at http://%s:%s", host, port)
})
