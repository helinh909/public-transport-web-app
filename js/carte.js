console.log("Exécution du programme carte.js");

//Creation de la carte
maCarte = L.map('map').setView([46.148358, -1.156659], 12.5);
const fondDeCarte = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 25,
});
fondDeCarte.addTo(maCarte);

//------------------------------------------------
//La geolocalisation
const maPositionIcon = L.icon({
  iconUrl: "images/maposition_icon.png",
  iconSize: [40, 40],
});

let latitude;
let longitude;
let maPosition = L.marker([0, 0], { icon: maPositionIcon }).addTo(maCarte);

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
  maCarte.setView([latitude, longitude], 15);
}

//--------------------------------------------------
//les Velos
const veloIcon = L.icon({
  iconUrl: "images/velo_icon.png",
  iconSize: [25, 25],
});
function recupererVelos() {
  const promesseRecupVelo = axios.get("https://opendata.agglo-larochelle.fr/d4c/api/records/1.0/search/dataset=yelo___disponibilite_des_velos_en_libre_service&rows=140&facet=station_nom");
  //promesseRecupVelo.then(afficherPositionsVelo);
  promesseRecupVelo.then(afficherVeloPlusProches);
  promesseRecupVelo.then(afficherPositionsVelo);
  promesseRecupVelo.catch(traiterErreurAjax);
}

function traiterDonneeRecue(reponseAjax) {
  console.log(reponseAjax);
}
function traiterErreurAjax(erreur) {
  console.log(erreur);
}
recupererVelos();

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
        [
          arret.fields.station_latitude.replace(",", "."),
          arret.fields.station_longitude.replace(",", "."),
        ],
        { icon: veloIcon }
      ).bindPopup("nom de la station : " +arret.fields.station_nom +
          "<br>" +"vélos disponibles: " +
          arret.fields.velos_disponibles + "/" +
          arret.fields.nombre_emplacements + "<br>" +
          "accroche disponibles: " + arret.fields.accroches_libres
      )
    )
  );
  maCarte.addLayer(markersVelo);
}
//-----------------------------------------------------
//Les bus
let markersBus;
function afficherPositionsBus(response) {
  const nomArret = response;
  console.log(nomArret);
  markersBus = new L.MarkerClusterGroup({
    maxClusterRadius: 15,
    removeOutsideVisibleBounds: true,
    iconCreateFunction: function (cluster) {
      return busIcon;
    },
  });
  nomArret.records.forEach((arret) => {
    markersBus.addLayer(
      L.marker([arret.fields.stop_lat, arret.fields.stop_lon], {icon: busIcon,}).bindPopup("arret: " + arret.fields.stop_name)
    );
  });
  maCarte.addLayer(markersBus);
}
//---------------------------------------------------
//fonction pour centrer l'arret le plus proche
let marqueurBusProche; 
function centrerArret(nomArret, response){
  const arretBus = response;
  arretBus.records.forEach(arret => {
    if (nomArret==arret.fields.stop_name){
      if (arretSelectionne) {
        maCarte.removeLayer(arretSelectionne);
      }
     // marqueurBusProche = L.marker([arret.fields.stop_lat, arret.fields.stop_lon], {icon: busProcheIcon}).addTo(map);
      maCarte.setView([arret.fields.stop_lat, arret.fields.stop_lon], 16.5);
      //console.log(arretBus)
      arretSelectionne = marqueurBusProche;
    }
  });
}
/*
function calculerDistance(lat,long, maLatitude, maLongitude, callback){  
  const R = 6371; // Rayon de la Terre en kilomètres

  const dLat = (lat - maLatitude) * (Math.PI / 180);
  const dLon = (long - maLongitude) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(maLatitude * (Math.PI / 180)) * Math.cos(lat * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;

  callback(distance);               
}
*/
function calculerDistance(lat,long,maLatitude,maLongitude,callback)
{

  const R = 6371; // Rayon de la Terre en kilomètres

  const dLat = degresVersRadians(lat - maLatitude);
  const dLon = degresVersRadians(long - maLongitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degresVersRadians(maLatitude)) * Math.cos(degresVersRadians(lat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;

  callback(distance);
}

function degresVersRadians(degrees) {
  return degrees * (Math.PI / 180);
}


//afficher l'arret le plus proche
function afficherArretsPlusProches(response){
  const arretBus = response;
  let arretsDistance = [];
  let count =0;

  obtenirPosition((position) => {
    const maLatitude = position.coords.latitude;
    const maLongitude = position.coords.longitude;

    arretBus.records.forEach((arret) => {
      calculerDistance(arret.fields.stop_lat, arret.fields.stop_lon, maLatitude, maLongitude, (distance) =>{
        // gerer les doublons
        const doubleArret = arretsDistance.findIndex(element => element.nomArret === arret.fields.stop_name);
        if (doubleArret === -1) {
          arretsDistance.push({ nomArret: arret.fields.stop_name, distance:Math.round(distance *100)/100})
        }
        count ++;
        if (count == arretBus.records.length){
          arretsDistance.sort((a, b) => a.distance - b.distance);
          ajouterArretProche(arretsDistance[0].nomArret,arretsDistance[0].distance,response);
          ajouterArretProche(arretsDistance[1].nomArret,arretsDistance[1].distance,response);
          ajouterArretProche(arretsDistance[2].nomArret,arretsDistance[2].distance,response);
        }
    })});
  });
}


//afficher le velo le plus proche
function afficherVeloPlusProches(response){
  const stationVelo = response.data;
  let veloDistance = [];
  let count =0;
  
  obtenirPosition((position) => {
    const maLat = parseFloat(position.coords.latitude);
    const maLong = parseFloat(position.coords.longitude);

    stationVelo.records.forEach((velo) => {
      const veloLatitude = parseFloat(velo.fields.station_latitude.replace(',', '.'));
      const veloLongitude = parseFloat(velo.fields.station_longitude.replace(',', '.'));

      calculerDistance(veloLatitude, veloLongitude, maLat, maLong, (distance) =>{
        veloDistance.push({ nomStation: velo.fields.station_nom, distance:Math.round(distance *100)/100})
        count ++;
        if (count == stationVelo.records.length){
          veloDistance.sort((a, b) => a.distance - b.distance);
          ajouterStationProche(veloDistance[0].nomStation,veloDistance[0].distance,response);
          ajouterStationProche(veloDistance[1].nomStation,veloDistance[1].distance,response);
          ajouterStationProche(veloDistance[2].nomStation,veloDistance[2].distance,response);
        }
    })});
  });
}


//------------------------------------------------------
//affichage de la carte avec l'arret selectionner 
  function recupInfo(busInfo)
  {
    busRecords = busInfo.records;

    const { fields } = busRecords[100];
    const bus_id = fields.stop_id;
    const apiUrl = `https://opendata.agglo-larochelle.fr/d4c/api/records/1.0/search/dataset=transport_yelo___gtfs_stop_times_des_bus&rows=144000&facet=trip_id`;
    // Recuperer d'autres informations en utilisant l'URL construite au dessus
    fetch(apiUrl)
      .then((response) => response.json())
      .then((busData) => {
        let idB;
        // trouver l'enregistrement that matches the bus_id
        //AfficherB(busData,idB)
        console.log(busData.records);
      });
  }
/*
  function AfficherB(busData, id) {
    // Définir une valeur par défaut pour "id" (si aucune valeur n'est fournie, utilisez "A3232")
    id = "P4604";
    console.log(id);
    // Recherche de l'enregistrement correspondant dans busData.records
    const matchingRecord = busData.records.find((record) => 
    {
      record.fields.stop_id == id
      console.log(record.fields)
    });
    // Vérification si un enregistrement correspondant a été trouvé
    if (matchingRecord) {
      console.log("hey");
    } else {
      console.log("Aucun enregistrement trouvé avec l'identifiant:", id);
    }
  }  
*/
//-----------------------------------------------
//
let arretSelectionne;

function ajouterArretProche(element, distance, response){
  const busProche = document.createElement('div');
  busProche.classList.add('recent-bus');

  const distanceBus = document.createElement('p');
  distanceBus.classList.add('distance-bus');
  distanceBus.textContent = distance*100 + " m ";

  const nomBus = document.createElement('p');
  nomBus.classList.add('name-bus');
  nomBus.textContent = element;

  busProche.appendChild(distanceBus);
  busProche.appendChild(nomBus);
  const busProches = document.querySelector(".recent-buses");
  busProches.appendChild(busProche); 

  const titreSuggere = document.querySelector('.suggéré');
  titreSuggere.textContent = 'Suggérés';

  //busProche.addEventListener('click', () =>centrerArret(element, response));
}

const lienBus = document.querySelector(".transport-velo");
          lienBus.addEventListener("click", () =>afficherVeloPlusProches(donneesJointes));

function ajouterStationProche(element, distance, response){

  const StationProche = document.createElement('div');
  StationProche.classList.add('recent-station');

  const distanceVelo = document.createElement('p');
  distanceVelo.classList.add('distance-station');
  distanceVelo.textContent = distance*100 + " m ";

  const nomStation = document.createElement('p');
  nomStation.classList.add('name-station');
  nomStation.textContent = element;

  StationProche.appendChild(distanceVelo);
  StationProche.appendChild(nomStation);
  const StationProches = document.querySelector(".recent-stations");
  StationProches.appendChild(StationProche); 

  const titreSuggere = document.querySelector('.suggéréVelo');
  titreSuggere.textContent = 'Suggérés';

  //StationProche.addEventListener('click', () =>centrerArret(element, response));
}








//--------------------------------------------------------------
//ajouter un decalage pour qu'il ne soit pas positionne directement aux coordonnees d'origine
function addOffsetToCoordinates(lat, lng, index) {
  const offset = index * 0.0001;
  return [lat + offset, lng + offset];
}
//----------------------------------------------------------
//recuperer les donnees des arrets de bus
const busIcon = L.icon({iconUrl: "images/bus_icon.png",iconSize: [25, 25],});
async function recupererDonneesArretsDeBus() {
  try {
    const response = await fetch("https://opendata.agglo-larochelle.fr/d4c/api/records/1.0/search/dataset=transport_yelo___gtfs_stop_des_bus&rows=1550&facet=stop_id" );
    if (!response.ok) {
      throw new Error("Network response was not ok.");
    }
    const busStopsData = await response.json();
    afficherPositionsBus(busStopsData);
    //afficherArretsPlusProches(busStopsData);
    recupInfo(busStopsData);    

    let BusStopCentrer;
    centrerArret(BusStopCentrer,busStopsData)

  

    return busStopsData;
  } catch (error) {
    console.error("Error fetching bus stop data:", error);
    return null;
  }
}

//-----------------------------------------------------------
// Fetch pour les noms des stations
let stationName = [];
const destinationInput = document.getElementById("destination-input");
const suggestionsList = document.getElementById("suggestions-list");

fetch("https://opendata.agglo-larochelle.fr/d4c/api/records/1.0/search/dataset=transport_yelo___gtfs_stop_des_bus&rows=1550&facet=stop_id")
  .then((response) => response.json())
  .then((stationData) => {
    //noms des stations a partir de la reponse de l'API
    const stationName = stationData.records.map((record) => ({
      stop: record.fields.stop_id,
      name: record.fields.stop_name,
      latitude: parseFloat(record.fields.stop_lat.split(",")[0]), //split-> liste separer par des virgules
      longitude: parseFloat(record.fields.stop_lon.split(",")[1]), //str to float
    }));
    // Assuming you have a select element for arrival
    const arrivalSelect = document.getElementById("suggestions-list");

    //la selection contiendra le nom des stations
    stationName.forEach((station) => {
      const option = document.createElement("option");
      option.value = station.name;
      option.textContent = station.name;
      //arrivalSelect.appendChild(option);
    });

    destinationInput.addEventListener("input", function () {
      const searchTerm = destinationInput.value.toLowerCase();
      const filteredStations = stationName.filter((station) =>
      station.name.toLowerCase().startsWith(searchTerm)
    );
    displaySuggestions(filteredStations);
    });
    function displaySuggestions(suggestions) {
      suggestionsList.innerHTML = "";
      suggestions.forEach((station) => {
        const suggestionItem = document.createElement("li");
        suggestionItem.textContent = station.name;
        suggestionsList.appendChild(suggestionItem);
        suggestionItem.addEventListener("click", () => {
          destinationInput.value = station.name;
          suggestionsList.innerHTML = "";
      });
    });
  }

//--------------------------------------------------------
// lorsque l'utilisateur change ou selectionne la destination dans la liste il zoom l'arret
recupererDonneesArretsDeBus().then((busStopsData) => {
  if (busStopsData) {
    arrivalSelect.addEventListener("click", (ev) => test(ev, busStopsData));
  }
});

function test(ev, busStopsData) {
  const selectedStationName = ev.target;
  //console.log(busStopsData);
  const contenuStation = selectedStationName.textContent;
  centrerArret(contenuStation, busStopsData);
}
//------------------------------------------------------










//--------------------------------------------------------------------
  //afficher les infos sur le bus zoomer (selectionner)
function afficherInfoBus(nomArretDeBus,busInfo,busStopLatitude,busStopLongitude) {
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
    maxZoom: 18,
  }).addTo(maCarte);
  const busInfoElement = document.getElementById("bus-info");

  if (busInfoElement) {
    // Clear previous content
    busInfoElement.innerHTML = "";

    // Create new elements to display bus information
    const busStopHeader = document.createElement("h2");
    busStopHeader.textContent = `Best Bus Stop: ${nomArretDeBus}`;

    const busInfoList = document.createElement("ul");
    busInfoList.classList.add("bus-info-list");

    // Populate the list with bus information
    busInfo.forEach((bus) => {
      const listItem = document.createElement("li");
      listItem.textContent = `Bus ${bus.busNumber}: ${bus.arrivalTime} - ${bus.departureTime}`;
      busInfoList.appendChild(listItem);
    });

    // Append elements to the busInfoElement
    busInfoElement.appendChild(busStopHeader);
    busInfoElement.appendChild(busInfoList);

    // Define a different marker icon for the new bus stop
    let popupContent = `<b>Bus Information</b><br>`;
    popupContent += `Station Name: ${stationName}<br>`;
    popupContent += `Arrival Time: ${arrivalTime}<br>`;
    popupContent += `Departure Time: ${departureTime}<br>`;
    popupContent += `Latitude: ${adjustedLat}<br>`;
    popupContent += `Longitude: ${adjustedLng}<br>`;

    L.marker([adjustedLat, adjustedLng],{ icon: busIcon }).addTo(maCarte).bindPopup(popupContent);
  }
};

//-------------------------------------------------------------
//afficher les informations sur les bus
fetch("https://opendata.agglo-larochelle.fr/d4c/api/records/1.0/search/dataset=transport_yelo___gtfs_stop_times_des_bus&facet=trip_id")
  .then((response) => response.json())
  .then((busData) => {
    const busRecords = busData.records;

    busRecords.forEach((bus, index) => {
      const busStopId = bus.fields.stop_id; 
      const arrivalTime = bus.fields.arrival_time;
      const departureTime = bus.fields.departure_time;

      // Find the corresponding station info based on _id
      const stationInfo = stationName.find((station) => station.stop_id === busStopId);

      if (stationInfo) {
        const latitude = stationInfo.latitude;
        const longitude = stationInfo.longitude;
        const stationName = stationInfo.name;

        // Apply an offset to latitude and longitude for each marker
        const [adjustedLat, adjustedLng] = addOffsetToCoordinates(latitude,longitude,index);

        let popupContent = `<b>Bus Information</b><br>`;
        popupContent += `Station Name: ${stationName}<br>`;
        popupContent += `Arrival Time: ${arrivalTime}<br>`;
        popupContent += `Departure Time: ${departureTime}<br>`;
        popupContent += `Latitude: ${adjustedLat}<br>`;
        popupContent += `Longitude: ${adjustedLng}<br>`;

        L.marker([adjustedLat, adjustedLng],{ icon: busIcon }).addTo(maCarte).bindPopup(popupContent);
      }
    });
  })
  .catch((error) => {
    console.error("Error fetching or processing bus data:", error);
  });
});







