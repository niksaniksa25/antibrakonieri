const API_URL =
"https://script.google.com/macros/s/AKfycbzZ_B_-UFAi4emDVsI9_PAnQNsw7LOMv-2RyT3c8HZGqRx20uKUVe4Z-DmANOePwn1-/exec";

// რუკის საწყისი მდებარეობა
const map = L.map("map").setView([41.9234, 41.9876], 13);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap"
}).addTo(map);

let marker = null;
const history = [];

// Google Sheets-იდან ბოლო მონაცემის მიღება
async function getData() {
  const status = document.getElementById("status");

  try {
    const requestUrl =
     `${API_URL}?action=read&t=${Date.now()}`;

    const response = await fetch(requestUrl, {
      cache: "no-store",
      redirect: "follow"
    });

    if (!response.ok) {
      throw new Error(HTTP შეცდომა: ${response.status});
    }

    const result = await response.json();

    console.log("მიღებული პასუხი:", result);

    if (!result.ok) {
      throw new Error(result.error || "სერვერის შეცდომა");
    }

    if (!result.data) {
      throw new Error("მონაცემები ჯერ არ არის");
    }

    const data = result.data;

    // კავშირის სტატუსი
    status.textContent = "🟢 Online";

    // ბატარეა
    document.getElementById("battery").textContent =
      data.battery
        ? `${data.battery} %`
        : "-- %";

    // წყალში სიგნალი
    document.getElementById("signal").textContent =
      data.signal || "--";

    // სიხშირე
    document.getElementById("frequency").textContent =
      data.frequency
        ? `${data.frequency} Hz`
        : "-- Hz";

    // განედი
    document.getElementById("latitude").textContent =
      data.latitude || "--";

    // გრძედი
    document.getElementById("longitude").textContent =
      data.longitude || "--";

    // ბოლო განახლების დრო
    document.getElementById("time").textContent =
      data.time || "--";

    // მდებარეობა
    document.getElementById("location").textContent =
      data.latitude && data.longitude
        ? `${data.latitude}, ${data.longitude}`
        : "--";

    updateMap(data);
    addHistory(data);

  } catch (error) {
    console.error("მონაცემების მიღების შეცდომა:", error);
    status.textContent = "🔴 Offline";
  }
}

// რუკისა და მარკერის განახლება
function updateMap(data) {
  const latitude = Number(data.latitude);
  const longitude = Number(data.longitude);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return;
  }

  if (marker === null) {
    marker = L.marker([latitude, longitude]).addTo(map);
  } else {
    marker.setLatLng([latitude, longitude]);
  }

  const popupContent = `
    <strong>წყალში სიგნალი:</strong> ${data.signal || "--"}<br>
    <strong>ბატარეა:</strong> ${data.battery || "--"}%<br>
    <strong>სიხშირე:</strong> ${data.frequency || "--"} Hz<br>
    <strong>ბოლო განახლება:</strong> ${data.time || "--"}
  `;

  marker
    .bindPopup(popupContent)
    .openPopup();

  map.setView([latitude, longitude], 15);
}

// ისტორიის ცხრილში მონაცემის დამატება
function addHistory(data) {
  const latestRecord = history[0];

  // ერთი და იგივე ჩანაწერი რამდენჯერმე არ დაემატოს
  if (
    latestRecord &&
    latestRecord.time === data.time
  ) {
    return;
  }

  history.unshift({
    time: data.time || "--",
    battery: data.battery || "--",
    signal: data.signal || "--",
    latitude: data.latitude || "--",
    longitude: data.longitude || "--"
  });

  // მხოლოდ ბოლო 10 ჩანაწერი
  if (history.length > 10) {
    history.pop();
  }

  showHistory();
}

// ისტორიის ცხრილის ჩვენება
function showHistory() {
  const tableBody = document.getElementById("history");

  if (!tableBody) {
    return;
  }

  tableBody.innerHTML = "";

  history.forEach(function (item) {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${item.time}</td>
      <td>${item.battery}%</td>
      <td>${item.signal}</td>
      <td>${item.latitude}</td>
      <td>${item.longitude}</td>
    `;

    tableBody.appendChild(row);
  });
}

// რუკაზე ადგილის ძებნა
async function searchLocation() {
  const input = document.getElementById("search");

  if (!input) {
    return;
  }

  const place = input.value.trim();

  if (!place) {
    return;
  }

  try {
    const searchUrl =
      `https://nominatim.openstreetmap.org/search` +
      `?format=json&limit=1&q=${encodeURIComponent(place)}`;

    const response = await fetch(searchUrl);
    const results = await response.json();

    if (results.length === 0) {
      alert("ადგილი ვერ მოიძებნა");
      return;
    }

    const latitude = Number(results[0].lat);
    const longitude = Number(results[0].lon);

    map.setView([latitude, longitude], 15);

  } catch (error) {
    console.error("ძებნის შეცდომა:", error);
    alert("ადგილის ძებნა ვერ შესრულდა");
  }
}

// გვერდის გახსნისას მონაცემის მიღება
getData();

// მონაცემის განახლება ყოველ 5 წამში
setInterval(getData, 5000);
