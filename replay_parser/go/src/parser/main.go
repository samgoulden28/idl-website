package main

import (
  "log"
  "os"

  "github.com/dotabuff/manta"
  "github.com/dotabuff/manta/dota"
)

func main() {
  // Create a new parser instance from a file. Alternatively see NewParser([]byte)
  f, err := os.Open("3179142574_982479018.dem")
  if err != nil {
    log.Fatalf("unable to open file: %s", err)
  }
  defer f.Close()

  p, err := manta.NewStreamParser(f)
  if err != nil {
    log.Fatalf("unable to create parser: %s", err)
  }

  // Register a callback, this time for the OnCUserMessageSayText2 event.
//  p.Callbacks.OnCUserMessageSayText2(func(m *dota.CUserMessageSayText2) error {
//    log.Printf("%s said: %s\n", m)
  //  return nil
 // })
  // Register a callback, this time for the OnCUserMessageSayText2 event.
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

  // Register a callback, this time for the OnCUserMessageSayText2 event.
//  p.Callbacks.OnCDOTAMatchMetadataFile(func(m *dota.CDOTAMatchMetadataFile) error {
  //  for i := 0;  i<=1; i++ {
//      for index, element := range m.Metadata.Teams[i].Players {
        // index is the index where we are
        // element is the element from someSlice for where we are
 //       log.Printf("\n\nPLAYER %d: %s\n\n", index, element.account_id)
  //    }
 //   }
//    return nil
//  })

  // Start parsing the replay!
  p.Start()

  log.Printf("Parse Complete!\n")
}
