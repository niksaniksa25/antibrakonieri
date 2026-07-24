const API_URL =
  "https://script.google.com/macros/s/AKfycbzZ_B_-UFAi4emDVsI9_PAnQNsw7LOMv-2RyT3c8HZGqRx20uKUVe4Z-DmANOePwn1-/exec";

// რუკის შექმნა
const map = L.map("map").setView([41.7151, 44.8271], 8);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap"
}).addTo(map);

let marker = null;
let history = [];

async function getData() {
  const statusElement = document.getElementById("status");

  try {
    const response = await fetch(${API_URL}?action=read, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(HTTP შეცდომა: ${response.status});
    }

    const result = await response.json();

    if (!result.ok || !result.data) {
      throw new Error("მონაცემები ვერ მოიძებნა");
    }

    const data = result.data;

    // კავშირის სტატუსი
    statusElement.textContent = "🟢 Online";

    // საინფორმაციო ბარათები
    document.getElementById("battery").textContent =
      data.battery ? ${data.battery} % : "-- %";

    document.getElementById("signal").textContent =
      data.signal || "--";

    document.getElementById("frequency").textContent =
      data.frequency ? ${data.frequency} Hz : "-- Hz";

    document.getElementById("latitude").textContent =
      data.latitude || "--";

    document.getElementById("longitude").textContent =
      data.longitude || "--";

    document.getElementById("time").textContent =
      data.time || "--";

    if (data.latitude && data.longitude) {
      document.getElementById("location").textContent =
        ${data.latitude}, ${data.longitude};
    } else {
      document.getElementById("location").textContent = "--";
    }

    // რუკის განახლება
    const latitude = Number(data.latitude);
    const longitude = Number(data.longitude);

    if (!Number.isNaN(latitude) && !Number.isNaN(longitude)) {
      if (marker === null) {
        marker = L.marker([latitude, longitude])
          .addTo(map)
          .bindPopup("სიგნალის დეტექტორი");
      } else {
        marker.setLatLng([latitude, longitude]);
      }

      marker
        .bindPopup(
          `<strong>სიგნალი:</strong> ${data.signal}<br>
           <strong>ბატარეა:</strong> ${data.battery}%<br>
           <strong>განახლება:</strong> ${data.time}`
        )
        .openPopup();

      map.setView([latitude, longitude], 15);
    }

    addHistory(data);

  } catch (error) {
    console.error(error);
    statusElement.textContent = "🔴 Offline";
  }
}

function addHistory(data) {
  const latest = history[0];

  // ერთი და იგივე ჩანაწერი ყოველ 5 წამში არ დაემატოს
  if (latest && latest.time === data.time) {
    return;
  }

  history.unshift({
    time: data.time || "--",
    battery: data.battery || "--",
    signal: data.signal || "--",
    latitude: data.latitude || "--",
    longitude: data.longitude || "--"
  });

  if (history.length > 10) {
    history.pop();
  }

  showHistory();
}

function showHistory() {
  const table = document.getElementById("history");
  table.innerHTML = "";

  history.forEach(item => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${item.time}</td>
      <td>${item.battery}%</td>
      <td>${item.signal}</td>
      <td>${item.latitude}</td>
      <td>${item.longitude}</td>
    `;

    table.appendChild(row);
  });
}

// ადგილის ძებნა OpenStreetMap-ით
async function searchLocation() {
  const searchInput = document.getElementById("search");
  const place = searchInput.value.trim();

  if (!place) {
    return;
  }

  try {
    const url =
      https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(place)};

    const response = await fetch(url);
    const results = await response.json();

    if (results.length === 0) {
      alert("ადგილი ვერ მოიძებნა");
      return;
    }

    const latitude = Number(results[0].lat);
    const longitude = Number(results[0].lon);

    map.setView([latitude, longitude], 15);

  } catch (error) {
    console.error(error);
    alert("ძებნა ვერ შესრულდა");
  }
}

// მონაცემის პირველად მიღება
getData();

// განახლება ყოველ 5 წამში
setInterval(getData, 5000);
