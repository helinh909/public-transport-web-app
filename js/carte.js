console.log("Exécution du programme carte.js");

//Creation de la carte
maCarte = L.map("map").setView([46.148358, -1.156659], 12.5);
const mapBoxAccessToken =
  "pk.eyJ1IjoicGVkcm9kYWN0eWxlIiwiYSI6IjVmdHRmUjgifQ.Cl1waAaPYaOY9qJr14rCew";
const mapBoxProjectId = "pedrodactyle.hgfj5llg";
const fondDeCarte = L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    attribution:
      'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 25,
    id: mapBoxProjectId,
    accessToken: mapBoxAccessToken,
  }
);
fondDeCarte.addTo(maCarte);

//------------------------------------------------------
//Recuperation de la localisation actuelle

if (navigator.geolocation) {
  let watchId = navigator.geolocation.watchPosition(obtenirPosition, error, {
    enableHighAccuracy: true,
  });
} else {
  alert("Votre navigateur ne prend pas en compte la géolocalisation");
}

const maPositionIcon = L.icon({
  iconUrl: "images/maposition_icon.png",
  iconSize: [40, 40],
});

let latitude;
let longitude;
let maPosition = L.marker([0, 0], { icon: maPositionIcon }).addTo(maCarte);

function obtenirPosition(position) {
  latitude = position.coords.latitude;
  longitude = position.coords.longitude;
  maPosition.setLatLng([latitude, longitude]);
}

function error() {
  alert("Impossible d'obtenir la localisation");
}

function stopperGeolocalisation() {
  navigator.geolocation.clearWatch(watchId);
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
    removeOutsideVisibleBounds: true,
    iconCreateFunction: function (cluster) {
      return veloIcon;
    },
  });
  nomArret.records.forEach((arret) =>
    markersVelo.addLayer(
      L.marker(
        [arret.fields.station_latitude, arret.fields.station_longitude],
        { icon: veloIcon }
      ).bindPopup(
        "nom de la station : " +
          arret.fields.station_nom +
          "<br>" +
          "vélos disponibles: " +
          arret.fields.velos_disponibles +
          "/" +
          arret.fields.nombre_emplacements +
          "<br>" +
          "accroche disponibles: " +
          arret.fields.accroches_libres
      )
    )
  );
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

function calculerDistance(lat, long) {
  const R = 6347;
  const a = latitude * (Math.PI / 180);
  const b = lat * (Math.PI / 180);
  const c = longitude * (Math.PI / 180);
  const d = long * (Math.PI / 180);
  return a;
  //return R* Math.acos(Math.sin(a)*Math.sin(b)+Math.cos(a)*Math.cos(b)*Math.cos(c-d));
}

function afficherArretsPlusProches(reponseAjax) {
  const nomArret = reponseAjax.data;
  nomArret.records.forEach((arret) => {
    const distance = calculerDistance(
      arret.fields.stop_lat,
      arret.fields.stop_lon
    );
    console.log(distance);
  });
}

//maCarte.addEventListener("click",afficherArretsPlusProches);
//-------------------------------------------------------

// _________________________________________ esseyer les suggestions de depart

document.addEventListener("DOMContentLoaded", function () {
  const departInput = document.getElementById("depart-input");
  const suggestionsList = document.getElementById("suggestions-list");

  departInput.addEventListener("input", function () {
    const userInput = departInput.value.toLowerCase();
    const suggestions = [
      "La Rochelle",
      "Les Minimes",
      "Charente-Maritime",
      "Aytré",
    ];
    const filteredSuggestions = suggestions.filter((suggestion) =>
      suggestion.toLowerCase().includes(userInput)
    );

    // Ajoutez "Ma position" à la liste des suggestions
    if (userInput.trim() !== "") {
      filteredSuggestions.unshift("Ma position");
    }

    suggestionsList.innerHTML = "";

    filteredSuggestions.forEach((suggestion) => {
      const suggestionItem = document.createElement("li");
      suggestionItem.textContent = suggestion;
      suggestionItem.addEventListener("click", function () {
        departInput.value = suggestion;
        suggestionsList.innerHTML = "";
      });
      suggestionsList.appendChild(suggestionItem);
    });
  });
});
