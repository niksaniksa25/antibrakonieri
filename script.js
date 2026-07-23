// Google Apps Script URL
const API_URL = 
"https://script.google.com/macros/s/AKfycbzR9nH0CT4PDGKsNhNkN6o_PrcbhikKJp-VHd69lXacaafAoX89SrX1kGP50VNxux44/exec";


// Map setup
let map = L.map('map').setView([41.7151, 44.8271], 8);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
}).addTo(map);


let marker = null;


// History storage
let history = [];


// Get data from Google Script
async function getData(){

    try {

        const response = await fetch(API_URL);

        const data = await response.json();


        console.log(data);


        // Status
        document.getElementById("status").innerHTML =
        "🟢 Online";


        // Cards update
        document.getElementById("battery").innerHTML =
        data.battery + " %";


        document.getElementById("signal").innerHTML =
        data.signal + " dBm";


        document.getElementById("frequency").innerHTML =
        data.frequency + " MHz";


        document.getElementById("location").innerHTML =
        data.location;


        document.getElementById("latitude").innerHTML =
        data.latitude;


        document.getElementById("longitude").innerHTML =
        data.longitude;


        document.getElementById("time").innerHTML =
        new Date().toLocaleString();



        // Update map

        let lat = Number(data.latitude);
        let lon = Number(data.longitude);


        if(!isNaN(lat) && !isNaN(lon)){


            if(marker == null){

                marker = L.marker([lat,lon])
                .addTo(map)
                .bindPopup("Anti-Braconier Device")
                .openPopup();

            }else{

                marker.setLatLng([lat,lon]);

            }


            map.setView([lat,lon],15);

        }



        // Add history

        history.unshift({

            time:new Date().toLocaleTimeString(),
            battery:data.battery,
            signal:data.signal,
            lat:data.latitude,
            lon:data.longitude

        });


        if(history.length > 10){
            history.pop();
        }


        showHistory();


    }
    catch(error){

        document.getElementById("status").innerHTML =
        "🔴 Offline";

        console.log(error);

    }

}



// Show table

function showHistory(){

    let table =
    document.getElementById("history");


    table.innerHTML="";


    history.forEach(item=>{


        table.innerHTML += `

        <tr>

        <td>${item.time}</td>

        <td>${item.battery}%</td>

        <td>${item.signal}</td>

        <td>${item.lat}</td>

        <td>${item.lon}</td>

        </tr>

        `;


    });

}



// Auto update every 5 seconds

getData();

setInterval(getData,5000);
function searchLocation(){

    let place = document.getElementById("search").value;

    let geocoder = new google.maps.Geocoder();

    geocoder.geocode(
    {address: place},
    function(results, status){

        if(status === "OK"){

            let position = results[0].geometry.location;

            map.setCenter(position);
            map.setZoom(15);


            marker.setPosition(position);


            document.getElementById("latitude").innerHTML =
            position.lat();


            document.getElementById("longitude").innerHTML =
            position.lng();

        }
    });

}