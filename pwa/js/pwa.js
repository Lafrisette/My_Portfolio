
///////////////////////////////////////////////////////////////////////////////////////////
// var globales
//////////////////////////////////////////////////////////////////////////////////////////
let myMap = null;

let routeLine = null;
let routeactive = false;

let aqipoint = null;
let lastaqi = null;

let infovisible = true;

let userpos = null;
let posroutemode = false;


const ROUTE_HISTORY_KEY = "route_history";
let routehistory = loadRouteHistory();

let lastRouteData = null;

let beforeInstallPromptEvent = null;

let install_button = null;
let reload_button = null;



///////////////////////////////////////////////////////////////////////////////////////////
//Listener (marche car pwa.js en differ sinon charge les Listner avant le DOM donc bug)
////////////////////////////////////////////////////////////////////////////////////////////
document.addEventListener('DOMContentLoaded', init);

document.getElementById('toggle-info-btn').addEventListener('click', toggleInfoBox);

document.getElementById('loc-btn').addEventListener('click', getUserLocation);

document.getElementById('search-btn').addEventListener('click', searchCity);
document.getElementById('search-input').addEventListener('keypress', keySearchCity);

document.getElementById('open-route-menu-btn').addEventListener('click', openRoutePanel);
document.getElementById('close-route-panel').addEventListener('click', closeRoutePanel);

document.getElementById('calc-route-btn').addEventListener('click', clickCalcRoute);

document.getElementById('pos-route-btn').addEventListener('click', togglePosRouteMode);
document.getElementById('clear-route-btn').addEventListener('click', clearRoute);

document.getElementById('info-risk-btn').addEventListener('click', openInfoModal);
document.getElementById('close-info-modal').addEventListener('click', closeInfoModal);

document.getElementById('save-route-btn').addEventListener('click', saveCurrentRoute);

/*  init() sert a demarrer l'app: carte + histo + PWA. On utilise des elem DOM
+ API/Leaflet/Fetch selon le besoin pour pouvoir piloter l'app. O
n change des etats (vars globales/UI/carte) pour refléter l'action. */
function init()
{
    // init: on lance carte + histo + PWA


    initMap(46.603354, 1.888334, 6);
    renderRouteHistory();
    initPwa();
}

/*  initPwa() sert a initialiser la partie PWA: boutons + events + SW.
On utilise des elem DOM + API/Leaflet/Fetch selon le besoin pour pouvoir piloter l'app.
On change des etats (vars globales/UI/carte) pour refléter l'action. */
function initPwa()
{
    // PWA: on recup btn install/reload + on branche events
    // PWA: on enregistre le SW (offline + maj)

    install_button = document.getElementById("install-btn");
    reload_button = document.getElementById("reload-btn");

    if (install_button)
    {
        install_button.addEventListener("click", installPwa);
    }

    if (reload_button)
    {
        reload_button.addEventListener("click", reloadPwa);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);


    registerServiceWorker();
}

/*  toggleInfoBox() sert a afficher/masquer la bottom-card (infos air).
On utilise des elem DOM + API/Leaflet/Fetch selon le besoin pour pouvoir piloter l'app.
 On change des etats (vars globales/UI/carte) pour refléter l'action. */
function toggleInfoBox()
{
    let box = document.querySelector('.bottom-card');

    if (!box)
    {
        return;
    }

    if (infovisible === true)
    {
        box.classList.add('hidden');
        infovisible = false;
    }
    else
    {
        box.classList.remove('hidden');
        infovisible = true;
    }
}

/*  openRoutePanel() sert a ouvrir le panneau itineraire.
On utilise des elem DOM + API/Leaflet/Fetch selon le besoin pour pouvoir piloter l'app.
On change des etats (vars globales/UI/carte) pour refléter l'action. */
function openRoutePanel()
{
    let panel = document.getElementById('route-panel');
    let btn = document.getElementById('open-route-menu-btn');

    panel.classList.remove('hidden');
    btn.style.display = 'none';
}

/*  closeRoutePanel() sert a fermer le panneau itineraire.
On utilise des elem DOM + API/Leaflet/Fetch selon le besoin pour pouvoir piloter l'app.
On change des etats (vars globales/UI/carte) pour refléter l'action. */
function closeRoutePanel()
{
    let panel = document.getElementById('route-panel');
    let btn = document.getElementById('open-route-menu-btn');

    panel.classList.add('hidden');
    btn.style.display = 'inline-block';
}

/*  openInfoModal() sert a ouvrir la modale risques AQI.
On utilise des elem DOM + API/Leaflet/Fetch selon le besoin pour pouvoir piloter l'app.
On change des etats (vars globales/UI/carte) pour refléter l'action. */
function openInfoModal()
{
    updateInfoModal();
    document.getElementById('info-modal').classList.remove('hidden');
}

/*  closeInfoModal() sert a fermer la modale risques AQI.
On utilise des elem DOM + API/Leaflet/Fetch selon le besoin pour pouvoir piloter l'app.
On change des etats (vars globales/UI/carte) pour refléter l'action. */
function closeInfoModal()
{
    document.getElementById('info-modal').classList.add('hidden');
}

/*  updateInfoModal() sert a mettre a jour le texte de la modale selon lastaqi.
On utilise des elem DOM + API/Leaflet/Fetch selon le besoin pour pouvoir piloter l'app.
On change des etats (vars globales/UI/carte) pour refléter l'action. */
function updateInfoModal()
{
    let txt = "";

    if (lastaqi === null)
    {
        txt = "clique sur la carte pour connaitre la qualite de l'air.";
    }
    else if (lastaqi < 40)
    {
        txt = "air sain. pas de risque special, tu peux sortir tranquille.";
    }
    else if (lastaqi < 70)
    {
        txt = "qualite moyenne. evite les efforts trop long ou trop intense.";
    }
    else
    {
        txt = "air pollue. masque recommande et efforts deconseille (surtout sport).";
    }

    document.getElementById('info-modal-text').innerText = txt;
}

/*  initMap() sert a creer la carte Leaflet + fond OSM + event clic.
On utilise des elem DOM + API/Leaflet/Fetch selon le besoin pour pouvoir piloter l'app.
On change des etats (vars globales/UI/carte) pour refléter l'action. */
function initMap(lat, lon, zoom)
{

    myMap = L.map('map').setView([lat, lon], zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution: '© OpenStreetMap'
    }).addTo(myMap);


    myMap.on('click', mapClick);
}

/*  mapClick() sert a gerer clic carte (AQI + mode route).
On utilise des elem DOM + API/Leaflet/Fetch selon le besoin pour pouvoir piloter l'app.
On change des etats (vars globales/UI/carte) pour refléter l'action. */
function mapClick(e)
{

    getAirQuality(e.latlng.lat, e.latlng.lng);


    if (posroutemode === true)
    {
        routeToClickedPoint(e.latlng.lat, e.latlng.lng);
        return;
    }


    if (routeactive === true)
    {
        return;
    }
}

/*  getUserLocation() sert a demander la geoloc (GPS).
On utilise des elem DOM + API/Leaflet/Fetch selon le besoin pour pouvoir piloter l'app.
On change des etats (vars globales/UI/carte) pour refléter l'action. */
function getUserLocation()
{
    if (!navigator.geolocation)
    {
        alert("geolocalisation non supportee");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        locationOk,
        locationKo,
        {
            enableHighAccuracy: true,
            timeout: 10000
        }
    );
}
/*  locationOk() sert a callback geoloc OK: stocker userpos + recentrer + AQI.
On utilise des elem DOM + API/Leaflet/Fetch selon le besoin pour pouvoir piloter l'app.
On change des etats (vars globales/UI/carte) pour refléter l'action. */
function locationOk(pos)
{
    let lat = pos.coords.latitude;
    let lon = pos.coords.longitude;

    userpos = { lat: lat, lon: lon };

    myMap.setView([lat, lon], 13);
    getAirQuality(lat, lon);

    document.getElementById('location-name').innerText = "position actuelle";
}

/*  locationKo() sert a callback geoloc KO: alerte.
On utilise des elem DOM + API/Leaflet/Fetch selon le besoin pour pouvoir piloter l'app.
On change des etats (vars globales/UI/carte) pour refléter l'action. */
function locationKo()
{
    alert("impossible de recuperer la position");
}

/*  keySearchCity() sert a detecter Enter pour lancer searchCity().
On utilise des elem DOM + API/Leaflet/Fetch selon le besoin pour pouvoir piloter l'app.
On change des etats (vars globales/UI/carte) pour refléter l'action. */
function keySearchCity(e)
{
    if (e.key === 'Enter')
    {
        searchCity();
    }
}

/*  searchCity() sert a geocoder une ville via Nominatim + recentrer + AQI.
On utilise des elem DOM + API/Leaflet/Fetch selon le besoin pour pouvoir piloter l'app.
On change des etats (vars globales/UI/carte) pour refléter l'action. */
function searchCity()
{
    let city = document.getElementById('search-input').value;

    if (!city)
    {
        return;
    }

    let url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(city);

    fetch(url)
    .then(function(res)
    {
        return res.json();
    })
    .then(function(data)
    {
        if (data.length > 0)
        {
            let lat = parseFloat(data[0].lat);
            let lon = parseFloat(data[0].lon);

            myMap.setView([lat, lon], 13);
            getAirQuality(lat, lon);
        }
        else
        {
            alert("ville non trouvee");
        }
    });
}

/*  getAirQuality() sert a appeler Open-Meteo air quality + maj UI + marqueur.
On utilise des elem DOM + API/Leaflet/Fetch selon le besoin pour pouvoir piloter l'app.
On change des etats (vars globales/UI/carte) pour refléter l'action. */
function getAirQuality(lat, lon)
{
    // API AQ: on construit l'URL Open-Meteo (AQI + PM)
    // fetch: on maj UI + marqueur, sinon msg erreur

    let url = 'https://air-quality-api.open-meteo.com/v1/air-quality?latitude=' + lat + '&longitude=' + lon + '&current=european_aqi,pm10,pm2_5';

    fetch(url)
    .then(function(res)
    {
        return res.json();
    })
    .then(function(data)
    {
        updateInterface(data, lat, lon);
        setAqiPoint(lat, lon, data);
    })
    .catch(function()
    {
        document.getElementById('aqi-value').innerText = 'erreur api';
    });
}

/*  setAqiPoint() sert a poser/maj un circleMarker AQI (1 seul) + popup.
On utilise des elem DOM + API/Leaflet/Fetch selon le besoin pour pouvoir piloter l'app.
On change des etats (vars globales/UI/carte) pour refléter l'action. */
function setAqiPoint(lat, lon, data)
{
    // carte: 1 seul marker AQI a la fois + popup details


    if (aqipoint !== null)
    {
        myMap.removeLayer(aqipoint);
        aqipoint = null;
    }

    aqipoint = L.circleMarker([lat, lon],
    {
        fillColor: getAqiColor(data.current.european_aqi),
        color: 'white',
        weight: 2,
        fillOpacity: 0.8,
        radius: 10
    }).addTo(myMap);

    aqipoint.bindPopup(
        'AQI: ' + data.current.european_aqi +
        '<br>PM2.5: ' + data.current.pm2_5 +
        '<br>PM10: ' + data.current.pm10
    );

    aqipoint.on('click', removeAqiPoint);
}

/*  removeAqiPoint() sert a supprimer le marqueur AQI + stopPropagation.
On utilise des elem DOM + API/Leaflet/Fetch selon le besoin pour pouvoir piloter l'app.
On change des etats (vars globales/UI/carte) pour refléter l'action. */
function removeAqiPoint(e)
{
    myMap.removeLayer(aqipoint);
    aqipoint = null;


    L.DomEvent.stopPropagation(e);
}



/*  updateInterface() sert a remplir UI (AQI/PM/coords) + couleurs + conseils.
On utilise des elem DOM + API/Leaflet/Fetch selon le besoin pour pouvoir piloter l'app.
On change des etats (vars globales/UI/carte) pour refléter l'action. */
function updateInterface(data, lat, lon)
{
    // UI: on affiche coords + AQI/PM
    // couleur: on adapte style + conseils (mask/emoji)

    let aqi = data.current.european_aqi || 0;
    lastaqi = aqi;

    let pm10 = data.current.pm10 || 0;
    let pm25 = data.current.pm2_5 || 0;

    document.getElementById('location-name').innerText =
        'Lat: ' + lat.toFixed(4) + ', Lon: ' + lon.toFixed(4);

    document.getElementById('aqi-value').innerText = aqi + ' AQI';
    document.getElementById('pm10-val').innerText = pm10 + ' µg/m³';
    document.getElementById('pm25-val').innerText = pm25 + ' µg/m³';

    let color = getAqiColor(aqi);

    document.getElementById('aqi-value').style.color = color;
    document.getElementById('face-icon').style.color = color;

    updateAdvice(aqi);
}

/*  updateAdvice() sert a mettre conseil masque + message sante + icone selon AQI.
On utilise des elem DOM + API/Leaflet/Fetch selon le besoin pour pouvoir piloter l'app.
On change des etats (vars globales/UI/carte) pour refléter l'action. */
function updateAdvice(aqi)
{
    let maskElem = document.getElementById('mask-advice');
    let msgElem = document.getElementById('health-message');
    let faceElem = document.getElementById('face-icon');

    if (aqi < 40)
    {
        maskElem.innerText = 'NON';
        maskElem.style.color = 'green';
        msgElem.innerText = 'air sain !';
        faceElem.innerText = 'sentiment_very_satisfied';
    }
    else if (aqi < 70)
    {
        maskElem.innerText = 'Conseillé';
        maskElem.style.color = 'orange';
        msgElem.innerText = 'attention efforts intenses';
        faceElem.innerText = 'sentiment_neutral';
    }
    else
    {
        maskElem.innerText = 'OUI';
        maskElem.style.color = 'red';
        msgElem.innerText = 'pollution elevee';
        faceElem.innerText = 'warning';
    }
}

/*  getAqiColor() sert a retourner une couleur en fct du niveau AQI.
On utilise des elem DOM + API/Leaflet/Fetch selon le besoin pour pouvoir piloter l'app.
On change des etats (vars globales/UI/carte) pour refléter l'action. */
function getAqiColor(aqi)
{
    if (aqi < 20) return "#4caf50";
    if (aqi < 40) return "#8bc34a";
    if (aqi < 60) return "#ffeb3b";
    if (aqi < 80) return "#ff9800";
    return "#f44336";
}


/*  clickCalcRoute() sert a handler bouton calcul itineraire (depart/arrivee).
On utilise des elem DOM + API/Leaflet/Fetch selon le besoin pour pouvoir piloter l'app.
On change des etats (vars globales/UI/carte) pour refléter l'action. */
function clickCalcRoute()
{
    let start = document.getElementById('start-city').value;
    let end = document.getElementById('end-city').value;

    if (start && end)
    {
        calculateAutoRoute(start, end);
    }
    else
    {
        alert("remplis depart et arrivee");
    }
}

/*  calculateAutoRoute() sert a pipeline route auto: reset + geocode + OSRM.
On utilise des elem DOM + API/Leaflet/Fetch selon le besoin pour pouvoir piloter l'app.
On change des etats (vars globales/UI/carte) pour refléter l'action. */
function calculateAutoRoute(startCity, endCity)
{
    resetRoute();

    geocodeCity(startCity, function(startCoords)
    {
        geocodeCity(endCity, function(endCoords)
        {
            requestRoute(startCoords, endCoords);
        });
    });
}



/*  geocodeCity() sert a convertir nom ville -> coords (Nominatim) via callback.
On utilise des elem DOM + API/Leaflet/Fetch selon le besoin pour pouvoir piloter l'app.
On change des etats (vars globales/UI/carte) pour refléter l'action. */
function geocodeCity(city, callback)
{
    let url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(city);

    fetch(url)
    .then(function(res)
    {
        return res.json();
    })
    .then(function(data)
    {
        if (data.length > 0)
        {
            callback({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) });
        }
        else
        {
            alert("ville non trouvee");
        }
    });
}

/*  requestRoute() sert a demander route OSRM + tracer polyline + analyser pollution.
On utilise des elem DOM + API/Leaflet/Fetch selon le besoin pour pouvoir piloter l'app.
On change des etats (vars globales/UI/carte) pour refléter l'action. */
function requestRoute(startCoords, endCoords)
{
    // OSRM: on demande la geo de route (driving)
    // UI/carte: on trace polyline + fitBounds + on lance analyse pollution


    let url = 'https://router.project-osrm.org/route/v1/driving/' +  startCoords.lon + ',' + startCoords.lat + ';' +  endCoords.lon + ',' + endCoords.lat +  '?overview=full&geometries=geojson';

    fetch(url)
    .then(function(res)
    {
        return res.json();
    })
    .then(function(data)
    {
        if (data.routes && data.routes.length > 0)
        {
            let latlngs = L.GeoJSON.coordsToLatLngs(data.routes[0].geometry.coordinates);

            routeLine = L.polyline(latlngs, { color: '#7f8c8d', weight: 5 }).addTo(myMap);
            routeactive = true;

            myMap.fitBounds(routeLine.getBounds());

            analyzeRoutePollution(latlngs);
        }
        else
        {
            alert("itineraire introuvable");
        }
    });
}

/*  clearRoute() sert a effacer route + couper mode pos-route.
On utilise des elem DOM + API/Leaflet/Fetch selon le besoin pour pouvoir piloter l'app.
On change des etats (vars globales/UI/carte) pour refléter l'action. */
function clearRoute()
{
    posroutemode = false;
    document.getElementById('pos-route-info').hidden = true;

    resetRoute();
}

/*  resetRoute() sert a supprimer la polyline route (sans toucher AQI).
 On utilise des elem DOM + API/Leaflet/Fetch selon le besoin pour pouvoir piloter l'app.
 On change des etats (vars globales/UI/carte) pour refléter l'action. */
function resetRoute()
{
    if (routeLine)
    {
        myMap.removeLayer(routeLine);
        routeLine = null;
    }

    routeactive = false;
}

/*  togglePosRouteMode() sert a activer/desactiver mode route depuis userpos.
On utilise des elem DOM + API/Leaflet/Fetch selon le besoin pour pouvoir piloter l'app.
 On change des etats (vars globales/UI/carte) pour refléter l'action. */
function togglePosRouteMode()
{
    if (userpos === null)
    {
        alert("clique d'abord sur localisation");
        return;
    }

    if (posroutemode === true)
    {
        posroutemode = false;
        document.getElementById('pos-route-info').hidden = true;
    }
    else
    {
        posroutemode = true;
        document.getElementById('pos-route-info').hidden = false;
    }
}

/*  routeToClickedPoint() sert a lancer route userpos -> point clique.
On utilise des elem DOM + API/Leaflet/Fetch selon le besoin pour pouvoir piloter l'app.
On change des etats (vars globales/UI/carte) pour refléter l'action. */
function routeToClickedPoint(lat, lon)
{
    posroutemode = false;
    document.getElementById('pos-route-info').hidden = true;

    resetRoute();

    requestRoute(
        { lat: userpos.lat, lon: userpos.lon },
        { lat: lat, lon: lon }
    );
}

/*  analyzeRoutePollution() sert a echantillonner AQI/PM sur la route + moyenne.
On utilise des elem DOM + API/Leaflet/Fetch selon le besoin pour pouvoir piloter l'app.
On change des etats (vars globales/UI/carte) pour refléter l'action. */
function analyzeRoutePollution(allPoints)
{
    // echantillonnage: on prend ~10 pts sur le tracé
    // stats: on calc moy AQI/PM puis on affiche le bilan

    let sumAqi = 0;
    let sumPm25 = 0;
    let sumPm10 = 0;

    let pointsChecked = 0;
    let nb_pt = 10;

    if (allPoints.length < nb_pt)
    {
        nb_pt = allPoints.length;
    }

    for (let i = 0; i < nb_pt; i++)
    {
        let index = Math.floor((allPoints.length * i) / nb_pt);
        let p = allPoints[index];

        let url = 'https://air-quality-api.open-meteo.com/v1/air-quality?latitude=' + p.lat + '&longitude=' + p.lng + '&current=european_aqi,pm10,pm2_5';

        fetch(url)
        .then(function(res)
        {
            return res.json();
        })
        .then(function(data)
        {
            sumAqi += data.current.european_aqi || 0;
            sumPm25 += data.current.pm2_5 || 0;
            sumPm10 += data.current.pm10 || 0;

            pointsChecked++;

            if (pointsChecked >= nb_pt)
            {
                let avgAqi = Math.round(sumAqi / nb_pt);
                let avgPm25 = Math.round(sumPm25 / nb_pt);
                let avgPm10 = Math.round(sumPm10 / nb_pt);

                displayRouteSummary(avgAqi, avgPm25, avgPm10);
            }
        })
        .catch(function()
        {
            pointsChecked++;
        });
    }
}

/*  displayRouteSummary() sert a afficher bilan trajet + recolorer route + lastRouteData.
On utilise des elem DOM + API/Leaflet/Fetch selon le besoin pour pouvoir piloter l'app.
On change des etats (vars globales/UI/carte) pour refléter l'action. */
function displayRouteSummary(avgAqi, avgPm25, avgPm10)
{
    let color = getAqiColor(avgAqi);

    document.getElementById('aqi-value').innerText = 'Moy. ' + avgAqi;
    document.getElementById('pm25-val').innerText = avgPm25 + ' µg/m³';
    document.getElementById('pm10-val').innerText = avgPm10 + ' µg/m³';
    document.getElementById('aqi-value').style.color = color;

    document.getElementById('mask-advice').innerText = getMaskAdvice(avgAqi);
    document.getElementById('mask-advice').style.color = getMaskColor(avgAqi);

    document.getElementById('health-message').innerText = 'Bilan trajet: ' + getHealthLabel(avgAqi);

    if (routeLine)
    {
        routeLine.setStyle({ color: color });
    }

    lastRouteData = {
        aqi: avgAqi,
        pm25: avgPm25,
        pm10: avgPm10,
        mask: getMaskAdvice(avgAqi),
        health: getHealthLabel(avgAqi),
        color: getAqiColor(avgAqi)
    };
}

/*  getMaskAdvice() sert a donner conseil masque selon AQI.
On utilise des elem DOM + API/Leaflet/Fetch selon le besoin pour pouvoir piloter l'app.
On change des etats (vars globales/UI/carte) pour refléter l'action. */
function getMaskAdvice(aqi)
{
    if (aqi < 40) return 'NON';
    if (aqi < 70) return 'Conseillé';
    return 'OUI';
}

/*  getMaskColor() sert a donner couleur du conseil masque.
On utilise des elem DOM + API/Leaflet/Fetch selon le besoin pour pouvoir piloter l'app.
On change des etats (vars globales/UI/carte) pour refléter l'action. */
function getMaskColor(aqi){
    if (aqi < 40) return 'green';
    if (aqi < 70) return 'orange';
    return 'red';
}

/*  getHealthLabel() sert a donner label sante selon AQI.
On utilise des elem DOM + API/Leaflet/Fetch selon le besoin pour pouvoir piloter l'app.
On change des etats (vars globales/UI/carte) pour refléter l'action. */
function getHealthLabel(aqi)
{
    if (aqi < 40) return 'SAIN';
    if (aqi < 70) return 'MOYEN';
    return 'TOXIQUE';
}


/*  loadRouteHistory() sert a charger histo depuis localStorage.
On utilise des elem DOM + API/Leaflet/Fetch selon le besoin pour pouvoir piloter l'app.
 On change des etats (vars globales/UI/carte) pour refléter l'action. */
function loadRouteHistory()
{
    const SAVED = localStorage.getItem(ROUTE_HISTORY_KEY);
    return SAVED ? JSON.parse(SAVED) : [];
}

/*  saveRouteHistory() sert a sauver histo dans localStorage.
On utilise des elem DOM + API/Leaflet/Fetch selon le besoin pour pouvoir piloter l'app.
On change des etats (vars globales/UI/carte) pour refléter l'action. */
function saveRouteHistory()
{
    localStorage.setItem(ROUTE_HISTORY_KEY, JSON.stringify(routehistory));
}

/*  saveCurrentRoute() sert a creer un objet trajet + enregistrer dans histo.
On utilise des elem DOM + API/Leaflet/Fetch selon le besoin pour pouvoir piloter l'app.
On change des etats (vars globales/UI/carte) pour refléter l'action. */
function saveCurrentRoute(){
    if (!routeLine)
    {
        alert("aucun itineraire a enregistrer");
        return;
    }

    let name = document.getElementById('save-name').value;

    if (!name)
    {
        alert("entre un nom de sauvegarde");
        return;
    }

    let start = document.getElementById('start-city').value;
    let end = document.getElementById('end-city').value;

    if (!start) start = "position";
    if (!end) end = "destination";


    let latlngs = routeLine.getLatLngs();
    let points = [];

    for (let i = 0; i < latlngs.length; i++)
    {
        points.push([latlngs[i].lat, latlngs[i].lng]);
    }

    let routeobj = {
        id: Date.now(),
        name: name,
        start: start,
        end: end,
        date: new Date().toLocaleString('fr-FR'),
        points: points,
        aqi: lastRouteData ? lastRouteData.aqi : null,
        pm25: lastRouteData ? lastRouteData.pm25 : null,
        pm10: lastRouteData ? lastRouteData.pm10 : null,
        mask: lastRouteData ? lastRouteData.mask : null,
        health: lastRouteData ? lastRouteData.health : null,
        color: lastRouteData ? lastRouteData.color : "#7f8c8d"
    };

    routehistory.push(routeobj);
    saveRouteHistory();

    document.getElementById('save-name').value = "";

    renderRouteHistory();
}

/*  renderRouteHistory() sert a afficher la liste des trajets sauvegardes.
On utilise des elem DOM + API/Leaflet/Fetch selon le besoin pour pouvoir piloter l'app.
On change des etats (vars globales/UI/carte) pour refléter l'action. */
function renderRouteHistory(){
    let list = document.getElementById('saved-route-list');
    list.innerHTML = "";

    if (routehistory.length === 0)
    {
        list.innerHTML = "<li>aucune sauvegarde</li>";
        return;
    }

    for (let i = routehistory.length - 1; i >= 0; i--)
    {
        createRouteHistoryItem(list, i);
    }
}

/*  createRouteHistoryItem() sert a creer un <li> avec boutons voir/suppr.
On utilise des elem DOM + API/Leaflet/Fetch selon le besoin pour pouvoir piloter l'app.
On change des etats (vars globales/UI/carte) pour refléter l'action. */
function createRouteHistoryItem(list, index){
    let item = routehistory[index];

    let li = document.createElement("li");

    let txt = document.createElement("span");
    txt.innerText = item.name + " (" + item.start + " → " + item.end + ")";

    let btnshow = document.createElement("button");
    btnshow.className = "mdl-button mdl-js-button";
    btnshow.innerText = "voir";
    btnshow.addEventListener("click", function()
    {
        showSavedRoute(index);
    });

    let btndel = document.createElement("button");
    btndel.className = "mdl-button mdl-js-button mdl-button--accent";
    btndel.innerText = "suppr";
    btndel.addEventListener("click", function()
    {
        deleteSavedRoute(index);
    });

    li.appendChild(txt);
    li.appendChild(btnshow);
    li.appendChild(btndel);

    list.appendChild(li);
}

/*  showSavedRoute() sert a re-afficher une route sauvegardee (polyline + UI).
On utilise des elem DOM + API/Leaflet/Fetch selon le besoin pour pouvoir piloter l'app.
On change des etats (vars globales/UI/carte) pour refléter l'action. */
function showSavedRoute(index)
{
    // carte: on retrace la polyline sauvegardee + on restaure le bilan

    let item = routehistory[index];

    resetRoute();

    routeLine = L.polyline(item.points, { color: item.color, weight: 5 }).addTo(myMap);
    routeactive = true;

    myMap.fitBounds(routeLine.getBounds());
    if (item.aqi !== null)
        {
            document.getElementById('aqi-value').innerText = 'Moy. ' + item.aqi;
            document.getElementById('pm25-val').innerText = item.pm25 + ' µg/m³';
            document.getElementById('pm10-val').innerText = item.pm10 + ' µg/m³';

            document.getElementById('mask-advice').innerText = item.mask;
            document.getElementById('health-message').innerText = 'Bilan trajet: ' + item.health;

            document.getElementById('aqi-value').style.color = item.color;


            document.getElementById('face-icon').style.color = item.color;
        }

    document.getElementById('start-city').value = item.start;
    document.getElementById('end-city').value = item.end;
}


/*  deleteSavedRoute() sert a supprimer une route sauvegardee + refresh.
On utilise des elem DOM + API/Leaflet/Fetch selon le besoin pour pouvoir piloter l'app.
On change des etats (vars globales/UI/carte) pour refléter l'action. */
function deleteSavedRoute(index)
{
    routehistory.splice(index, 1);
    saveRouteHistory();
    renderRouteHistory();
}


function onBeforeInstallPrompt(event)
{
    console.debug("onBeforeInstallPrompt()");

    event.preventDefault();
    beforeInstallPromptEvent = event;

    if (install_button)
    {
        install_button.disabled = false;
    }
}


async function installPwa()
{

    console.debug("installPwa()");

    if (!beforeInstallPromptEvent)
    {
        return;
    }

    await beforeInstallPromptEvent.prompt();

    if (beforeInstallPromptEvent.userChoice)
    {
        const CHOICE = await beforeInstallPromptEvent.userChoice;
        console.log("install choice:", CHOICE.outcome);
    }

    if (install_button)
    {
        install_button.disabled = true;
    }

    beforeInstallPromptEvent = null;
    window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
}


function onAppInstalled()
{
    console.debug("onAppInstalled()");

    if (install_button)
    {
        install_button.disabled = true;
    }
}

async function registerServiceWorker()
{
    console.debug("registerServiceWorker()");

    if ("serviceWorker" in navigator)
    {
        console.log("Register Service Worker…");

        try
        {
            const REGISTRATION = await navigator.serviceWorker.register("/mendyt/LASTFOLDERPWA/pwa/service_worker.js");
            REGISTRATION.onupdatefound = onUpdateFound;

            console.log("Service Worker registration successful with scope:", REGISTRATION.scope);
        }
        catch(error)
        {
            console.error("Service Worker registration failed:", error);
        }
    }
    else
    {
        console.warn("Service Worker not supported…");
    }

}

function onUpdateFound(event)
{
    console.debug("onUpdateFound()");

    const REGISTRATION = event.target;
    const SERVICE_WORKER = REGISTRATION.installing;

    if (SERVICE_WORKER)
    {
        SERVICE_WORKER.addEventListener("statechange", onStateChange);
    }
}

function onStateChange(event)
{
    const SERVICE_WORKER = event.target;

    console.debug("onStateChange", SERVICE_WORKER.state);

    if (SERVICE_WORKER.state === "installed" && navigator.serviceWorker.controller)
    {
        console.log("PWA Updated");

        if (reload_button)
        {
            reload_button.disabled = false;
        }
    }
}

function reloadPwa()
{
    console.debug("reloadPwa()");

    window.location.reload();
}
