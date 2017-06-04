package main

import (
  "log"
  "os"

  "github.com/dotabuff/manta"
  "github.com/dotabuff/manta/dota"
  "gopkg.in/mgo.v2"
  "gopkg.in/mgo.v2/bson"
)

func main() {
  // Create a new parser instance from a file. Alternatively see NewParser([]byte)
  argsWithoutProg := os.Args[1:]
  demo := argsWithoutProg[0]
  fixture := argsWithoutProg[1]
  match_id := argsWithoutProg[2]
  log.Println("Demo:", demo, "Fixture:", fixture, "Match ID:", match_id);
  f, err := os.Open(demo)
  if err != nil {
    log.Fatalf("unable to open file: %s", err)
  }
  defer f.Close()

  p, err := manta.NewStreamParser(f)
  if err != nil {
    log.Fatalf("unable to create parser: %s", err)
  }

  session, err := mgo.Dial("localhost:27017")
  if err != nil {
          panic(err)
  }
  defer session.Close()

  // Optional. Switch the session to a monotonic behavior.
  session.SetMode(mgo.Monotonic, true)

  c := session.DB("test1").C("fixtures")

  p.Callbacks.OnCDemoSaveGame(func(m *dota.CDemoSaveGame) error {
    save,err := manta.ParseCDemoSaveGame(m)
    if err != nil {
      for key, value := range save.Players {
        // Update "_id": bson.ObjectIdHex("5909e0cf447fd5e78b5aa503"),
      	colQuerier := bson.M{"_id": bson.ObjectIdHex(fixture), "games" : bson.M{"$elemMatch": bson.M{"matchID" : match_id}}}
        change := bson.M{"$push": bson.M{"games.$.radiant.heroes": bson.M{"player" : value.Name, "hero": value.Hero}}}
        if value.Team != 2 {
          change = bson.M{"$push": bson.M{"games.$.dire.heroes": bson.M{"player" : value.Name, "hero": value.Hero}}}
        }

      	err = c.Update(colQuerier, change)

      	if err != nil {
      		panic(err)
      	}
        log.Println("Key:", key, "Team:", value.Team, "Player:", value.Name ,"Hero:", value.Hero)
        if 0 == 1 {
          log.Println("Value:", value)
        }
      }
      //log.Fatalf("unable to open file: %s", err)
    }
    p.Stop()
    return nil
  })

  // Start parsing the replay!
  p.Start()

  log.Printf("Parse Complete!\n")
}
