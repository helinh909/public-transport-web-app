const carte = document.querySelector("#map")
carte.addEventListener('click', recupererUnObjet);

console.log("execution");

function recupererUnObjet(){
    const promesseRecup = axios.get('https://opendata.agglo-larochelle.fr/d4c/api/records/1.0/search/dataset=transport_yelo___gtfs_stop_des_bus&facet=stop_id');
    promesseRecup.then(afficherCoordonnees)
    promesseRecup.catch(traiterErreurAjax)
}

function traiterDonneeRecue(reponseAjax){
    console.log(reponseAjax);
}

function traiterErreurAjax(erreur){
    console.log(erreur);
}

function afficherCoordonnees(reponseAjax){
    const nomArret = reponseAjax.data
    console.log(nomArret);
    nomArret.records.forEach(arret => {
        console.log(arret.fields.stop_lat);
        console.log(arret.fields.stop_lon)})
}