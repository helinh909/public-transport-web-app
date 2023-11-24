console.log('Exécution du programme carte.js');

//creation de la carte 

maCarte = L.map('map').setView([46.148358, -1.156659], 12.5);


const mapBoxAccessToken = 'pk.eyJ1IjoicGVkcm9kYWN0eWxlIiwiYSI6IjVmdHRmUjgifQ.Cl1waAaPYaOY9qJr14rCew';
const mapBoxProjectId = 'pedrodactyle.hgfj5llg';
const fondDeCarte = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18,
    id: mapBoxProjectId,
    accessToken: mapBoxAccessToken
});

fondDeCarte.addTo(maCarte);




// Obtenir notre position actuelle

function obtenirCoord(position){
    let latitude = position.coords.latitude;
    let longitude = position.coords.longitude;
    L.marker([latitude, longitude]).addTo(maCarte);
    //marker.bindPopup("Vous êtes ici").openPopup();
}

function error(){
    console.log("Impossible d'obtenir votre localisation");
}

navigator.geolocation.getCurrentPosition(obtenirCoord, error);

const carte = document.querySelector("#map")
//carte.addEventListener('click', recupererUnObjet);

// Appel Ajax

function recupererBus(){
    const promesseRecupBus = axios.get('https://opendata.agglo-larochelle.fr/d4c/api/records/1.0/search/dataset=transport_yelo___gtfs_stop_des_bus&rows=1550&facet=stop_id');
    promesseRecupBus.then(afficherPositionsBus)
    promesseRecupBus.catch(traiterErreurAjax)
}

function recupererVelo(){
    const promesseRecupVelo = axios.get('https://opendata.agglo-larochelle.fr/d4c/api/records/1.0/search/dataset=yelo___disponibilite_des_velos_en_libre_service&rows=140&facet=station_nom');
    promesseRecupVelo.then(afficherPositionsBus)
    promesseRecupVelo.catch(traiterErreurAjax)
}

function traiterDonneeRecue(reponseAjax){
    console.log(reponseAjax);
}

function traiterErreurAjax(erreur){
    console.log(erreur);
}

recupererBus();
recupererVelo();

// Icone bus

var busIcon =L.icon({
    iconUrl: 'images/bus_icon.png',
    iconSize: [30,30],
});

// Icone velo

var veloIcon =L.icon({
    iconUrl: 'images/velo_icon.png',
    iconSize: [30,30],
});

// Afficher les emplacements des bus

function afficherPositionsBus(reponseAjax){
    const nomArret = reponseAjax.data
    console.log(nomArret);
    nomArret.records.forEach(arret => 
        //arretBus_latitude = arret.fields.stop_lat;
        //arretBus_longitude = arret.fields.stop_lon;
        L.marker([arret.fields.stop_lat, arret.fields.stop_lon], {icon: busIcon}).addTo(maCarte));
        nomArret.records.forEach(arret => 
        L.marker([arret.fields.station_latitude, arret.fields.station_longitude], {icon: veloIcon}).addTo(maCarte));
    
        /*L.circle([arretBus_latitude,arretBus_longitude],{
            color:'green', 
            fillColor : 'green',
            radius :5
        }).addTo(maCarte)});*/
}

function afficherPositionsVelos(reponseAjax){
    const nomArret = reponseAjax.data;
    nomArret.records.forEach(arret => 
        L.marker([arret.fields.station_latitude, arret.fields.station_longitude], {icon: veloIcon}).addTo(maCarte));

}



