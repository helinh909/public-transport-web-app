//console.log("Exécution du programme carte.js");

//Creation de la carte
maCarte = L.map("map").setView([46.148358, -1.156659], 12.5);
const fondDeCarte = L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    attribution:
      'Map data &copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://mapbox.com">Mapbox</a>',
    maxZoom: 25,
  }
);
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

let positionUtilisee = false;

function obtenirPosition(callback) {
  if (positionUtilisee) {
    callback(positionUtilisee);
  } else if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        positionUtilisee = position;
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
        maPosition.setLatLng([latitude, longitude]);
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

function error() {
  alert("Impossible d'obtenir la localisation");
}

let geolocalisationDemandee = false;
//Recentrage sur notre position
boutonRecentrage = document.querySelector(".boutonRecentrage");
boutonRecentrage.addEventListener("click", recentrerPosition);

function recentrerPosition() {
  maCarte.setView([latitude, longitude], 15);
}

//--------------------------------------------------
//les Velos

const veloImage = new Image();
veloImage.src = "images/velo_icon.png";
veloImage.alt = "Description de l'icône de bus";

const veloIcon = L.icon({
  iconUrl: veloImage.src,
  iconSize: [25, 25],
  alt : veloImage.alt,
});
function recupererVelos() {
  const promesseRecupVelo = axios.get(
    "https://opendata.agglo-larochelle.fr/d4c/api/records/1.0/search/dataset=yelo___disponibilite_des_velos_en_libre_service&rows=140&facet=station_nom"
  );
  promesseRecupVelo.then(afficherPositionsVelo);
  promesseRecupVelo.then(afficherVeloPlusProches);
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
        { icon: veloIcon, alt : veloImage.alt}
      ).bindPopup(
        "Nom de la station : " +
          arret.fields.station_nom +
          "<br>" +
          "Vélos disponibles: " +
          arret.fields.velos_disponibles +
          "/" +
          arret.fields.nombre_emplacements +
          "<br>" +
          "Accroches disponibles: " +
          arret.fields.accroches_libres
      )
    )
  );
  maCarte.addLayer(markersVelo);
}
//-----------------------------------------------------
//Les bus
let markersBus;
function afficherPositionsBus(response) {
  let coordBus = [];
  const nomArret = response;
  nomArret.records.forEach((arret)=>{    
      coordBus.push({latitude: arret.fields.stop_lat, longitude:arret.fields.stop_lon, nom:arret.fields.stop_name, parentStation : arret.fields.parent_station })
  })
  markersBus = new L.MarkerClusterGroup({
    maxClusterRadius: 15,
    removeOutsideVisibleBounds: true,
    iconCreateFunction: function (cluster) {
      return busIcon;
    },
  });
  coordBus.forEach((arret) => {
    if (arret.parentStation!== ""){
      markersBus.addLayer(
        L.marker([arret.latitude, arret.longitude], {icon: busIcon, alt:"marqueur"}).bindPopup("<strong>Arrêt : </strong>" + arret.nom)
      );
    }
  });
  maCarte.addLayer(markersBus);
}
//---------------------------------------------------

let marqueurBusProche;

function centrerArret(nomArret, response){
  const arretBus = response;
  arretBus.forEach(arret => {
    if (nomArret==arret.donneesArrets.fields.stop_name){
      if (arretSelectionne) {
        maCarte.removeLayer(arretSelectionne);
      }
      const marqueurBusProche = L.marker([arret.donneesArrets.fields.stop_lat, arret.donneesArrets.fields.stop_lon], { icon: busIcon })
      .bindPopup(`<strong>${arret.donneesArrets.fields.stop_name}</strong>`);

    maCarte.setView([arret.donneesArrets.fields.stop_lat, arret.donneesArrets.fields.stop_lon], 16.5);
    maCarte.addLayer(marqueurBusProche);
    marqueurBusProche.openPopup();
    }
  });
}

function centrerArretVelos(nomArret, response) {
  const stationVelos = response.data;
  stationVelos.records.forEach((station) => {
    if (nomArret == station.fields.station_nom) {
      if (arretSelectionne) {
        maCarte.removeLayer(arretSelectionne);
      }
      const marqueurVeloProche = L.marker(
        [
          parseFloat(station.fields.station_latitude.replace(",", ".")),
          parseFloat(station.fields.station_longitude.replace(",", ".")),
        ],
        { icon: veloIcon }
      ).bindPopup(
        "Nom de la station : " +
          station.fields.station_nom +
          "<br>" +
          "Vélos disponibles: " +
          station.fields.velos_disponibles +
          "/" +
          station.fields.nombre_emplacements +
          "<br>" +
          "Accroches disponibles: " +
          station.fields.accroches_libres
      );
      maCarte.setView(
        [
          parseFloat(station.fields.station_latitude.replace(",", ".")),
          parseFloat(station.fields.station_longitude.replace(",", ".")),
        ],
        16.5
      );
      maCarte.addLayer(marqueurVeloProche);
      marqueurVeloProche.openPopup();
    }
  });
}

function centrerArretSelectionne(ev, busStopData) {
  const selectedStationName = ev.target;
  const contenuStation = selectedStationName.textContent;
  centrerArret(contenuStation, busStopData);
  supprimerHoraires();
  afficherHorairesProches(contenuStation, busStopData);
  colorerFond(lienHoraire, lienBus, lienVelo);
}

function calculerDistance(lat, long, maLatitude, maLongitude, callback) {
  const R = 6371; // Rayon de la Terre en kilomètres
  const dLat = degresVersRadians(lat - maLatitude);
  const dLon = degresVersRadians(long - maLongitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degresVersRadians(maLatitude)) *
      Math.cos(degresVersRadians(lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  callback(distance);
}

function degresVersRadians(degrees) {
  return degrees * (Math.PI / 180);
}

const lienBus = document.querySelector(".transport-bus");
const lienVelo = document.querySelector(".transport-velo");
const lienHoraire = document.querySelector(".transport-horaire");

function afficherArretsPlusProches(response){
  const arretBus = response;
  let arretsDistance = [];
  let count =0;

  obtenirPosition((position) => {
    if(position){      
      const maLatitude = position.coords.latitude;
      const maLongitude = position.coords.longitude;
      arretBus.forEach((arret) => {

        calculerDistance(arret.donneesArrets.fields.stop_lat, arret.donneesArrets.fields.stop_lon, maLatitude, maLongitude, (distance) =>{
          // gerer les doublons
          const doubleArret = arretsDistance.findIndex(element => element.nomArret === arret.donneesArrets.fields.stop_name);
          if (doubleArret === -1) {
            arretsDistance.push({ nomArret: arret.donneesArrets.fields.stop_name, distance:(Math.round(distance *10))})
          }
          count ++;
          if (count == arretBus.length){
            arretsDistance.sort((a, b) => a.distance - b.distance);
            ajouterArretProche(arretsDistance[0].nomArret,arretsDistance[0].distance,response);
            ajouterArretProche(arretsDistance[1].nomArret,arretsDistance[1].distance,response);
            ajouterArretProche(arretsDistance[2].nomArret,arretsDistance[2].distance,response);
          }
      })});
    }
    else{
      afficherErreurLocalisation(sectionBus,"bus");
    }
  });   
  lienBus.style.backgroundColor = "#e0e0e0";
}

let clicBus = false;
const titreSuggere = document.querySelector(".suggéré");
const sectionBus = document.querySelector(".recent-buses");
const sectionVelos = document.querySelector(".recent-stations");
const sectionHoraires = document.querySelector(".recent-horaires");

function afficherErreurLocalisation(section, type) {
  const stations = document.createElement('div');
  stations.classList.add(`recent-${type}`);
  const stationElement = document.createElement('p');
  stationElement.classList.add("no-station");
  stationElement.textContent = "Impossible de déterminer votre position. Veuillez actualiser la page pour permettre la localisation.";
  stations.appendChild(stationElement);
  section.appendChild(stations);
}

function ajouterArretProche(element, distance, response){  
  const busProche = document.createElement('div');
  busProche.classList.add('recent-bus');
  const aBus = document.createElement('a');
  aBus.classList.add('recent-bus-link');
  aBus.setAttribute('role', 'button');  
  aBus.setAttribute('tabindex', '0');

  const distanceBus = document.createElement('p');
  distanceBus.classList.add('distance-bus');
  distanceBus.textContent = distance*100 + " m ";

  const nomBus = document.createElement('p');
  nomBus.classList.add('name-bus');
  nomBus.textContent = element;

  busProche.appendChild(distanceBus);
  busProche.appendChild(nomBus);
  aBus.appendChild(busProche)
  sectionBus.appendChild(aBus); 
  
  titreSuggere.textContent = "Recommandés";

  aBus.addEventListener('click', () =>{clicBus = true;centrerArret(element, response)});
  aBus.addEventListener('click', supprimerHoraires);
  aBus.addEventListener('click', () =>{afficherHorairesProches(element, response); colorerFond(lienHoraire, lienBus, lienVelo)});
}

function estProche(heure1, minute1, heure2, minute2) {
  const minutes1 = heure1 * 60 + minute1;
  const minutes2 = heure2 * 60 + minute2;
  return Math.abs(minutes1 - minutes2) < 5;
}
function afficherHorairesProches(nomArret,response){
  const arretBus = response;
  let horaires = [];
  arretBus.forEach(arret => {
    if (nomArret==arret.donneesArrets.fields.stop_name){
      const minutes = parseInt(arret.donneesHorairesBus.fields.departure_time.substring(3, 5));
      const heures = parseInt(arret.donneesHorairesBus.fields.departure_time.substring(0, 2));        
      const destinationActuelle = arret.donneesLignes.fields.trip_headsign;
      if (!horaires.some(item =>
        (item.horaire.substring(0, 5) === arret.donneesHorairesBus.fields.departure_time.substring(0, 5)) ||
        (estProche(parseInt(item.horaire.substring(0, 2)),parseInt(item.horaire.substring(3, 5)), heures,minutes) &&
        destinationActuelle === item.arrivee))) {
        horaires.push({horaire : arret.donneesHorairesBus.fields.departure_time.substring(0, 5), ligne : arret.donneesLignes.fields.route_id.slice(1), arrivee : destinationActuelle, nom: arret.donneesArrets.fields.stop_name })
      }
    }
  });
  let horaireProche = false;
  for (let i = 0; i < 8; i++) {
    if (!horaires[0] && !horaireProche){
      const horaireDiv = document.createElement('div');
      horaireDiv.classList.add('recent-horaire');
      const horaireBus = document.createElement('p');
      horaireBus.classList.add("no-horaire");
      horaireBus.textContent = "Aucun horaire disponible";
      horaireDiv.appendChild(horaireBus);
      sectionHoraires.appendChild(horaireDiv);
      horaireProche = true;
      clicBus = true;
      afficherSection(sectionHoraires,sectionBus,sectionVelos);
    }
    if (horaires[i]){
      ajouterHoraires(horaires[i].horaire, horaires[i].ligne, horaires[i].arrivee, horaires[i].nom);
    }
  }
}
let presenceTitre = false;

function ajouterHoraires(horaire, ligne, destination, nom) {
  sectionBus.classList.add("invisible");
  sectionHoraires.classList.remove("invisible");

  const horaires = document.createElement("div");
  horaires.classList.add("recent-horaire");

  const horaireBus = document.createElement("p");
  horaireBus.classList.add("horaire-bus");
  horaireBus.textContent = horaire;

  const ligneBus = document.createElement("p");
  ligneBus.classList.add("ligne-bus");
  ligneBus.textContent = " Ligne " + ligne;

  const destinationBus = document.createElement("p");
  destinationBus.classList.add("destination-bus");
  destinationBus.textContent = " vers " + destination;

  if (!presenceTitre) {
    const nomBus = document.createElement("h3");
    nomBus.classList.add("title-bus");
    nomBus.textContent = "Arrêt " + nom;
    sectionHoraires.appendChild(nomBus);
    titreSuggere.textContent = "Horaires";
    presenceTitre = true;
  }
  horaires.appendChild(horaireBus);
  horaires.appendChild(ligneBus);
  horaires.appendChild(destinationBus);
  sectionHoraires.appendChild(horaires);
}

function ajouterStationProche(element, distance, response) {
  const stationProche = document.createElement("div");
  stationProche.classList.add("recent-station");
  const aVelos = document.createElement("a");
  aVelos.classList.add("recent-bus-link");  
  aVelos.setAttribute('role', 'button');  
  aVelos.setAttribute('tabindex', '0');

  const distanceVelo = document.createElement("p");
  distanceVelo.classList.add("distance-station");
  distanceVelo.textContent = distance * 100 + " m ";

  const nomStation = document.createElement("p");
  nomStation.classList.add("name-station");
  nomStation.textContent = element;

  stationProche.appendChild(distanceVelo);
  stationProche.appendChild(nomStation);
  aVelos.appendChild(stationProche);
  sectionVelos.appendChild(aVelos);

  aVelos.addEventListener("click", () => centrerArretVelos(element, response));
}

//afficher le velo le plus proche
function afficherVeloPlusProches(response){
  const stationVelo = response.data;
  let veloDistance = [];
  let count =0;
  
  obtenirPosition((position) => {
    if(position){
      const maLat = parseFloat(position.coords.latitude);
      const maLong = parseFloat(position.coords.longitude);

      stationVelo.records.forEach((velo) => {
        const veloLatitude = parseFloat(velo.fields.station_latitude.replace(',', '.'));
        const veloLongitude = parseFloat(velo.fields.station_longitude.replace(',', '.'));
      
        calculerDistance(veloLatitude, veloLongitude, maLat, maLong, (distance) =>{
          veloDistance.push({ nomStation: velo.fields.station_nom, distance:Math.round(distance *10)})
          count ++;
          if (count == stationVelo.records.length){
            veloDistance.sort((a, b) => a.distance - b.distance);
            ajouterStationProche(veloDistance[0].nomStation,veloDistance[0].distance,response);
            ajouterStationProche(veloDistance[1].nomStation,veloDistance[1].distance,response);
            ajouterStationProche(veloDistance[2].nomStation,veloDistance[2].distance,response);
          }
      })});
    }
    else{
      afficherErreurLocalisation(sectionVelos, "station");
    }
  });  
  sectionVelos.classList.add("invisible");

}

//-----------------------------------------------

let arretSelectionne;

lienHoraire.addEventListener("click", () =>afficherSection(sectionHoraires,sectionBus,sectionVelos,"Horaires"));
lienBus.addEventListener("click", () =>afficherSection(sectionBus,sectionHoraires,sectionVelos, "Recommandés"));
lienVelo.addEventListener("click",() => afficherSection(sectionVelos,sectionBus,sectionHoraires,"Les plus proches"));

let clicHoraire = false;
function afficherSection(section1, section2, section3, titre){
  titreSuggere.textContent = titre;
  if(!clicBus && section1==sectionHoraires && !clicHoraire){
    const horaires = document.createElement('div');
    horaires.classList.add('recent-horaire');
    const horaireBus = document.createElement('p');
    horaireBus.classList.add("no-horaire");
    horaireBus.textContent = "Aucun arrêt n'est sélectionné";
    horaires.appendChild(horaireBus);
    sectionHoraires.appendChild(horaires);
    clicHoraire=true;    
  }
  if(section1 == sectionHoraires){
    colorerFond(lienHoraire,lienBus,lienVelo);
  }
  else if(section1 == sectionBus){
    colorerFond(lienBus,lienHoraire,lienVelo);
  }
  else if(section1 == sectionVelos){
    colorerFond(lienVelo,lienBus,lienHoraire);
  }
  section1.classList.remove("invisible");    
  section2.classList.add("invisible");   
  section3.classList.add('invisible');  
}

function colorerFond(element1,element2, element3){  
  element1.style.backgroundColor = "#e0e0e0";
  element2.style.backgroundColor = "#FFFFFF";  
  element3.style.backgroundColor = "#FFFFFF";
}

function supprimerHoraires() {
  while (sectionHoraires.firstChild) {
    sectionHoraires.removeChild(sectionHoraires.firstChild);
  }
  presenceTitre = false;
}

//--------------------------------------------------------------
//ajouter un decalage pour qu'il ne soit pas positionne directement aux coordonnees d'origine
function addOffsetToCoordinates(lat, lng, index) {
  const offset = index * 0.0001;
  return [lat + offset, lng + offset];
}
//----------------------------------------------------------
//recuperer les donnees des arrets de bus

let stationsName = [];

const busImage = new Image();
busImage.src = "images/bus_icon.png";
busImage.alt = "Description de l'icône de bus";

const busIcon = L.icon({iconUrl:busImage.src ,iconSize: [25, 25],});

async function recupererDonneesArretsDeBus() {
  try {
    const response = await fetch("https://opendata.agglo-larochelle.fr/d4c/api/records/1.0/search/dataset=transport_yelo___gtfs_stop_des_bus&rows=1550&facet=stop_id" );
    if (!response.ok) {
      throw new Error("La réponse du réseau n'est pas valide.");
    }
    const busStopsData = await response.json();
    afficherPositionsBus(busStopsData);

    busStopsData.records.forEach((arret) => {
      const doubleArret = stationsName.findIndex(element => element.name === arret.fields.stop_name);
      if (doubleArret === -1) {
        stationsName.push(
          {stop: arret.fields.stop_id,
          name: arret.fields.stop_name,
          latitude: parseFloat(arret.fields.stop_lat.split(",")[0]), //split-> liste separée par des virgules
          longitude: parseFloat(arret.fields.stop_lon.split(",")[1]), //str to float})
          }     
      )}     
    }) 

    //la selection contiendra le nom des stations
    stationsName.forEach((station) => {
      const option = document.createElement("option");  
      option.value = station.name;      
      option.textContent = station.name;
    });   

    return busStopsData;
  } catch (error) {
    console.error("Erreur lors de la récupération des données des arrêts de bus", error);
    return null;
  }
}
//-----------------------------------------------------------
// Fetch pour les noms des stations

const destinationInput = document.getElementById("destination-input");
const suggestionsList = document.getElementById("suggestions-list");
// Assuming you have a select element for arrival
const arrivalSelect = document.getElementById("suggestions-list");

let selectedSuggestionIndex = -1;

destinationInput.addEventListener("input", function () {
  const searchTerm = destinationInput.value.toLowerCase();
  const filteredStations = stationsName.filter((station) =>
    station.name.toLowerCase().startsWith(searchTerm)
  );
  displaySuggestions(filteredStations);
});

destinationInput.addEventListener("keyup", function (event) {
  const suggestions = document.querySelectorAll(".suggestions-list li");
});

function displaySuggestions(suggestions) {
  suggestionsList.innerHTML = "";

  suggestions.forEach((station, index) => {
    const suggestionItem = document.createElement("li");
    suggestionItem.textContent = station.name;
    suggestionsList.appendChild(suggestionItem);

    suggestionItem.addEventListener("click", () => {
      destinationInput.value = station.name;
      suggestionsList.innerHTML = "";
      selectedSuggestionIndex = -1;
      destinationInput.blur();
    });

    suggestionItem.addEventListener("mouseover", () => {
      suggestionItem.classList.add("highlight");
    });
    suggestionItem.addEventListener("mouseout", () => {
      suggestionItem.classList.remove("highlight");
    });
  });

  updateSuggestionHighlight();
}

function updateSuggestionHighlight() {
  const suggestions = document.querySelectorAll(".suggestions-list li");

  suggestions.forEach((suggestion, index) => {
    if (index === selectedSuggestionIndex) {
      suggestion.classList.add("selected");
    } else {
      suggestion.classList.remove("selected");
    }
    if (suggestion.contains(document.activeElement)) {
      suggestion.classList.add("highlight");
    } else {
      suggestion.classList.remove("highlight");
    }
  });
}
destinationInput.addEventListener("blur", () => {
  suggestionListTimeout = setTimeout(() => {
    suggestionsList.innerHTML = "";
  }, 200);
});

//------------------------------------------------------

const apiUrl =
  "https://opendata.agglo-larochelle.fr/d4c/api/records/1.0/search/";
const dataset = "transport_yelo___gtfs_stop_times_des_bus";

const heureActuelle = new Date().toLocaleTimeString("en-US", { hour12: false });
const urlHoraires = `${apiUrl}dataset=${dataset}&q=departure_time>${heureActuelle}&rows=10000&facet=trip_id&sort=departure_time`;

async function recupererDonneesHoraires() {
  try {
    const response = await fetch(urlHoraires);
    if (!response.ok) {
      throw new Error("La réponse du réseau n'est pas valide.");
    }
    const busStopsData = await response.json();

    return busStopsData;
  } catch (error) {
    console.error("Erreur lors de la récupération des données des arrêts de bus:", error);
    return null;
  }
}

async function recupererDonneesLignes() {
  try {
    const response = await fetch("https://opendata.agglo-larochelle.fr/d4c/api/records/1.0/search/dataset=transport_yelo___gtfs_trips_des_bus&rows=5550&facet=route_id");
    if (!response.ok) {
      throw new Error("La réponse du réseau n'est pas valide.");
    }
    const busStopsData = await response.json();

    return busStopsData;
  } catch (error) {
    console.error("Erreur:", error);
    return null;
  }
}

async function traiterDonnees() {
  try {
      const arrets = await recupererDonneesArretsDeBus();
      const horaires = await recupererDonneesHoraires();
      const lignes = await recupererDonneesLignes();

      if (arrets && horaires && lignes) {
          const donneesJointes = rejoindreDonnees(arrets.records, horaires.records, lignes.records);
          //console.log('Données arrêts, horaires et lignes:', donneesJointes);
          let BusStopCentrer;
          centrerArret(BusStopCentrer,donneesJointes);
          let element;
          arrivalSelect.addEventListener("click", (ev) => {centrerArretSelectionne(ev, donneesJointes)});
          afficherArretsPlusProches(donneesJointes);
          const lienHoraire = document.querySelector(".transport-marche");
      }
  } catch (error) {
      console.error("Erreur:", error);
  }
}

function rejoindreDonnees(arrets, horaires, lignes) {
  tableauDonnees = []
  horaires.forEach(arret=>{
    const stopId = arret.fields.stop_id;
    const arretCorrespondant = arrets.find(arret => arret.fields.stop_id === stopId);
    const ligneCorrespondante = lignes.find(ligne => ligne.fields.trip_id === arret.fields.trip_id);

    if (arretCorrespondant) {
      const infos = {donneesHorairesBus : arret, donneesArrets : arretCorrespondant, donneesLignes: ligneCorrespondante}
      tableauDonnees.push(infos);
    }
  });
  return tableauDonnees;
}
traiterDonnees();

//------------------------------------------------------

