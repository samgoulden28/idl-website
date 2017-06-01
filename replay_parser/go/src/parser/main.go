package main

import (
  "log"
  "os"

  "github.com/dotabuff/manta"
  "github.com/dotabuff/manta/dota"
)

func main() {
  // Create a new parser instance from a file. Alternatively see NewParser([]byte)
  f, err := os.Open("3218657022.dem")
  if err != nil {
    log.Fatalf("unable to open file: %s", err)
  }
  defer f.Close()

  p, err := manta.NewStreamParser(f)
  if err != nil {
    log.Fatalf("unable to create parser: %s", err)
  }

  p.Callbacks.OnCDemoSaveGame(func(m *dota.CDemoSaveGame) error {
    save,err := manta.ParseCDemoSaveGame(m)
    if err != nil {
      for key, value := range save.Players {
        log.Println("Key:", key, "Team:", value.Team, "Player:", value.Name ,"Hero:", value.Hero)
        if 0 == 1 {
          log.Println("Value:", value)
        }
      }
      //log.Fatalf("unable to open file: %s", err)
    }
    return nil
  })

  // Start parsing the replay!
  p.Start()

  log.Printf("Parse Complete!\n")
}
