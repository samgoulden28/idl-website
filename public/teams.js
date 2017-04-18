function displayTeamsForSeason(season, teams, max_seasons) {
  document.getElementById("season_no").innerHTML = "SEASON " + season
  for(i = 1; i <= max_seasons; i++) {
    console.log(document.getElementById("season" + season + "Pane").style.display)
    if(i == season) {
      document.getElementById("season" + i + "Pane").style.display = "block"
      addClassToElement(document.getElementById("season" + i + "Button"), 'w3-black')
      removeClassFromElement(document.getElementById("season" + i + "Button"), 'w3-hover-black')
    } else {
      document.getElementById("season" + i + "Pane").style.display = "none"
      addClassToElement(document.getElementById("season" + i + "Button"), 'w3-hover-black')
      removeClassFromElement(document.getElementById("season" + i + "Button"), 'w3-black')
    }
  }
}

function addClassToElement(element, cls) {
  var regexp = new RegExp("\\b" + cls + "\\b");
  console.log("Add " + cls + " to element");
  if (!regexp.test(element.className)) {
    console.log("Do it");
    element.className = element.className += " " + cls;
  }
}

function removeClassFromElement(element, cls) {
  var regexp = new RegExp("(?:^|\\s)" + cls + "(?!\\S)", "g");
  element.className = element.className.replace(regexp, '')
}
