const API_URL =
  "https://script.google.com/macros/s/AKfycbzZ_B_-UFAi4emDVsI9_PAnQNsw7LOMv-2RyT3c8HZGqRx20uKUVe4Z-DmANOePwn1-/exec";

const map = L.map("map").setView([41.9234, 41.9876], 13);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap"
}).addTo(map);

let marker = null;
let history = [];

async function getData() {
  const status = document.getElementById("status");

  try {
    const response = await fetch(${API_URL}?action=read&t=${Date.now()});

    if (!response.ok) {
      throw new Error(HTTP შეცდომა: ${response.status});
    }

    const result = await response.json();
    console.log("მიღებული პასუხი:", result);

    if (!result.ok || !result.data) {
      throw new Error("მონაცემი არ მოიძებნა");
    }

    const data = result.data;

    status.textContent = "🟢 Online";

    document.getElementById("battery").textContent =
      ${data.battery || "--"} %;

    document.getElementById("signal").textContent =
      data.signal || "--";

    document.getElementById("frequency").textContent =
      ${data.frequency || "--"} Hz;

    document.getElementById("latitude").textContent =
      data.latitude || "--";

    document.getElementById("longitude").textContent =
      data.longitude || "--";

    document.getElementById("time").textContent =
      data.time || "--";

    document.getElementById("location").textContent =
      data.latitude && data.longitude
        ? ${data.latitude}, ${data.longitude}
        : "--";

    const lat = Number(data.latitude);
    const lon = Number(data.longitude);

    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      if (!marker) {
        marker = L.marker([lat, lon]).addTo(map);
      } else {
        marker.setLatLng([lat, lon]);
      }

      marker
        .bindPopup(
          `<b>სიგნალი:</b> ${data.signal}<br>
           <b>ბატარეა:</b> ${data.battery}%<br>
           <b>დრო:</b> ${data.time}`
        )
        .openPopup();

      map.setView([lat, lon], 15);
    }

    addHistory(data);

  } catch (error) {
    console.error("შეცდომა:", error);
    status.textContent = "🔴 Offline";
  }
}

function addHistory(data) {
  if (history.length > 0 && history[0].time === data.time) {
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

  if (!table) {
    return;
  }

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

async function searchLocation() {
  const input = document.getElementById("search");

  if (!input || !input.value.trim()) {
    return;
  }

  try {
    const url =
      https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(input.value.trim())};

    const response = await fetch(url);
    const results = await response.json();

    if (!results.length) {
      alert("ადგილი ვერ მოიძებნა");
      return;
    }

    map.setView(
      [Number(results[0].lat), Number(results[0].lon)],
      15
    );
  } catch (error) {
    console.error(error);
  }
}

getData();
setInterval(getData, 5000);
