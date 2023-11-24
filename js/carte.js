console.log("Exécution du programme carte.js");

//Creation de la carte 
maCarte = L.map('map').setView([46.148358, -1.156659], 12.5);
const fondDeCarte = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 25,
});
fondDeCarte.addTo(maCarte);

//------------------------------------------------------
//Recuperation de la localisation actuelle

/*if(navigator.geolocation){
    let watchId = navigator.geolocation.getCurrentPosition(obtenirPosition,error,
    {enableHighAccuracy:true ,maximumAge:0, timeout:60000});
}
else{
    alert("Votre navigateur ne prend pas en compte la géolocalisation");
}*/

const maPositionIcon = L.icon({
  iconUrl: "images/maposition_icon.png",
  iconSize: [40, 40],
});

let latitude;
let longitude;
let maPosition = L.marker([0, 0], { icon: maPositionIcon }).addTo(maCarte);

/*function obtenirPosition(position, reponseAjax){
    latitude = position.coords.latitude;
    longitude = position.coords.longitude;
    console.log(latitude);
    console.log(longitude);
    console.log(position.coords.accuracy)
    maPosition.setLatLng([latitude,longitude]);
} */

function obtenirPosition(callback) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                latitude = position.coords.latitude;
                longitude = position.coords.longitude;
                console.log(latitude);
                console.log(longitude);
                console.log(position.coords.accuracy)
                maPosition.setLatLng([latitude,longitude]);
                callback(position);
            },
            (error) => {
                alert("Impossible d'obtenir la localisation");
                callback(null);
            },
            { enableHighAccuracy: true, maximumAge: 0, timeout: 60000 }
        );
    } else {
        alert("Votre navigateur ne prend pas en compte la géolocalisation");
        callback(null);
    }
}

function stopperGeolocalisation() {
  navigator.geolocation.clearWatch(watchId);
}

function error(){
    alert("Impossible d'obtenir la localisation");
}

//Recentrage sur notre position

boutonRecentrage = document.querySelector(".boutonRecentrage");
boutonRecentrage.addEventListener("click", recentrerPosition);

function recentrerPosition() {
  //navigator.geolocation.watchPosition(obtenirPosition, error);
  maCarte.setView([latitude, longitude], 15);
}

//-----------------------------------------------------
//API
const carte = document.querySelector("#map");
function recupererBus() {
  const promesseRecupBus = axios.get(
    "https://opendata.agglo-larochelle.fr/d4c/api/records/1.0/search/dataset=transport_yelo___gtfs_stop_des_bus&rows=1550&facet=stop_id"
  );
  promesseRecupBus.then(afficherPositionsBus);
  promesseRecupBus.then(afficherArretsPlusProches);
  promesseRecupBus.catch(traiterErreurAjax);
}

function recupererVelos() {
  const promesseRecupVelo = axios.get(
    "https://opendata.agglo-larochelle.fr/d4c/api/records/1.0/search/dataset=yelo___disponibilite_des_velos_en_libre_service&rows=140&facet=station_nom"
  );
  promesseRecupVelo.then(afficherPositionsVelo);
  promesseRecupVelo.catch(traiterErreurAjax);
}

function traiterDonneeRecue(reponseAjax) {
  console.log(reponseAjax);
}
function traiterErreurAjax(erreur) {
  console.log(erreur);
}
recupererBus();
recupererVelos();
//-------------------------------------------------------
//les Velos
const veloIcon = L.icon({
  iconUrl: "images/velo_icon.png",
  iconSize: [25, 25],
});

function afficherPositionsVelo(reponseAjax) {
  const nomArret = reponseAjax.data;
  let markersVelo = new L.MarkerClusterGroup({
    maxClusterRadius: 10,
    //supprimer marqueurs trop éloignés de la fenêtre d'affichage
    removeOutsideVisibleBounds:true,
    iconCreateFunction: function(cluster) {
        return veloIcon}});
    nomArret.records.forEach(arret => 
        markersVelo.addLayer(L.marker([arret.fields.station_latitude.replace(',', '.'),arret.fields.station_longitude.replace(',', '.')],{icon: veloIcon}).bindPopup(
            "nom de la station : "+arret.fields.station_nom + "<br>" +
            "vélos disponibles: " +arret.fields.velos_disponibles+ "/"+arret.fields.nombre_emplacements+ "<br>" +
            "accroche disponibles: " + arret.fields.accroches_libres)));
    maCarte.addLayer(markersVelo);
}

//------------------------------------------------------
//Les bus
const busIcon = L.icon({
  iconUrl: "images/bus_icon.png",
  iconSize: [25, 25],
});

function afficherPositionsBus(reponseAjax) {
  const nomArret = reponseAjax.data;
  let markersBus = new L.MarkerClusterGroup({
    maxClusterRadius: 15,
    removeOutsideVisibleBounds: true,
    iconCreateFunction: function (cluster) {
      return busIcon;
    },
  });
  nomArret.records.forEach((arret) => {
    markersBus.addLayer(
      L.marker([arret.fields.stop_lat, arret.fields.stop_lon], {
        icon: busIcon,
      }).bindPopup("arret: " + arret.fields.stop_name)
    );
  });
  maCarte.addLayer(markersBus);
}
 
function calculerDistance(lat,long, maLatitude, maLongitude, callback){    
    const R = 6347;
    const b = lat * (Math.PI / 180);
    const d = long * (Math.PI /180);
    const a = maLatitude * (Math.PI / 180);
    const c = maLongitude * (Math.PI / 180);
    const distance= R* Math.acos(Math.sin(a)*Math.sin(b)+Math.cos(a)*Math.cos(b)*Math.cos(c-d));
    callback(distance);    
}

function afficherArretsPlusProches(reponseAjax){
    const arretBus = reponseAjax.data;
    let arretsDistance = [];
    let count =0;
    console.log(arretBus);

    obtenirPosition((position) => {
        const maLatitude = position.coords.latitude;
        const maLongitude = position.coords.longitude;
        arretBus.records.forEach(arret => {
                    calculerDistance(arret.fields.stop_lat, arret.fields.stop_lon, maLatitude, maLongitude, (distance) =>{
                        // gerer les doublons
                        const doubleArret = arretsDistance.findIndex(element => element.nomArret === arret.fields.stop_name);
                        if (doubleArret === -1) {
                            arretsDistance.push({ nomArret: arret.fields.stop_name, distance:Math.round(distance *100)/100 })
                        }
                        count ++;
                        if (count == arretBus.records.length){
                            arretsDistance.sort((a, b) => a.distance - b.distance);
                            console.log(arretsDistance[0].nomArret + " : " + arretsDistance[0].distance * 100 + " mètres");
                            console.log(arretsDistance[1].nomArret + " : " + arretsDistance[1].distance * 100 + " mètres");
                            console.log(arretsDistance[2].nomArret + " : " + arretsDistance[2].distance * 100 + " mètres");
                        }  
        })});
    });
}

//-------------------------------------------------------

// _________________________________________ esseyer les suggestions de depart
const departInput = document.getElementById("depart-input");
const arriveeInput = document.getElementById("arrivee-input");
const departSuggestionsList = document.getElementById(
  "depart-suggestions-list"
);
const arriveeSuggestionsList = document.getElementById(
  "arrivee-suggestions-list"
);

departInput.addEventListener("focus", () =>
  showSuggestions(departInput, departSuggestionsList)
);
departInput.addEventListener("input", () =>
  handleInput(departInput, departSuggestionsList)
);

arriveeInput.addEventListener("focus", () =>
  showSuggestions(arriveeInput, arriveeSuggestionsList)
);
arriveeInput.addEventListener("input", () =>
  handleInput(arriveeInput, arriveeSuggestionsList)
);

function showSuggestions(input, suggestionsList) {
  const suggestions = fetchSuggestions("");
  displaySuggestions(suggestions, suggestionsList);

  function handleInput(input, suggestionsList) {
    const userInput = input.value.trim();
    const suggestions = fetchSuggestions(userInput);
    displaySuggestions(suggestions, suggestionsList);
  }

  function fetchSuggestions(query) {
    const suggestionsStatiques = [
      "Technoforum",
      "Les Minimes",
      "Dames Blanche",
    ];
    return suggestionsStatiques.filter((suggestion) =>
      suggestion.toLowerCase().includes(query.toLowerCase())
    );
  }

  function displaySuggestions(suggestions, suggestionsList) {
    suggestionsList.innerHTML = "";
    suggestions.forEach((suggestion) => {
      const listItem = document.createElement("li");
      listItem.textContent = suggestion;
      listItem.addEventListener("click", () =>
        selectSuggestion(suggestion, input)
      );
      suggestionsList.appendChild(listItem);
    });
  }

  function selectSuggestion(suggestion, input) {
    input.value = suggestion;
    suggestionsList.innerHTML = "";
  }
}
document.addEventListener("click", (event) => {
  // Vérifier si l'événement de clic ne provient pas des inputs ou de la liste de suggestions
  if (
    !departInput.contains(event.target) &&
    !arriveeInput.contains(event.target) &&
    !departSuggestionsList.contains(event.target) &&
    !arriveeSuggestionsList.contains(event.target)
  ) {
    // Si le clic n'est pas dans les inputs ou les suggestions, fermez les suggestions
    departSuggestionsList.innerHTML = "";
    arriveeSuggestionsList.innerHTML = "";
  }
});
