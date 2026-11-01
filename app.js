const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";
const MAX_RECENT = 5;

// ==========================================
// DOM ELEMENTS (GIVEN)
// ==========================================
const form = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");
const loading = document.getElementById("loading");
const errorBox = document.getElementById("error");
const weatherDisplay = document.getElementById("weather-display");
const historyList = document.getElementById("search-history");

const cityName = document.getElementById("city-name");
const weatherIcon = document.getElementById("weather-icon");
const temperature = document.getElementById("temperature");
const description = document.getElementById("description");
const feelsLike = document.getElementById("feels-like");
const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");
const pressure = document.getElementById("pressure");

// ==========================================
// HELPERS (GIVEN)
// ==========================================
function showLoading() { loading.classList.remove("hidden"); }
function hideLoading() { loading.classList.add("hidden"); }
function showError(message) { errorBox.textContent = message; errorBox.classList.remove("hidden"); }
function hideError() { errorBox.classList.add("hidden"); }

// ==========================================
// STEP 1: fetchWeather(city)
// - URL: `${BASE_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
// - if (!response.ok): 404 => throw new Error("City not found")
// - 401 => throw new Error("API key not valid yet")
// - else throw new Error("Failed to fetch weather data")
// - WHY: fetch does NOT reject on 404. It only rejects when there's no network.
// ==========================================
async function fetchWeather(city) {
    const url = `${BASE_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
    const response = await fetch(url);
    
    if (!response.ok) {
        if (response.status === 404) throw new Error("City not found");
        if (response.status === 401) throw new Error("API key not valid yet");
        throw new Error("Failed to fetch weather data");
    }
    
    return await response.json();
}

// ==========================================
// STEP 2: getWeather(city)
// - if API_KEY is missing (typeof API_KEY === "undefined" || !API_KEY):
//   showError("Missing API key...")
// - showLoading(); hideError();
// - try { const data = await fetchWeather(city); displayWeather(data); saveToHistory(); renderHistory(); }
// - catch ( showError(err.name === "TypeError" ? "Network error" : err.message) )
// - finally { hideLoading(); }  // runs whether it worked or not
// ==========================================
async function getWeather(city) {
    if (typeof API_KEY === "undefined" || !API_KEY) {
        showError("Missing API key: copy config.example.js to config.js and add your key.");
        return;
    }

    showLoading();
    hideError();

    try {
        const data = await fetchWeather(city);
        displayWeather(data);
        saveToHistory(city);
        renderHistory();
    } catch (err) {
        if (err.name === "TypeError") {
            showError("Network error, check your connection.");
        } else {
            showError(err.message);
        }
    } finally {
        hideLoading();
    }
}

// ==========================================
// STEP 3: displayWeather(data)
// - fill all EIGHT fields with textContent
// - city "Nairobi, KE" (data.name, data.sys.country)
// - temperature `${Math.round(data.main.temp)}°C`
// - description data.weather[0].description
// - wind data.wind.speed, feels like data.main.feels_like, humidity data.main.humidity
// - pressure data.main.pressure
// - then remove "hidden" from weatherDisplay
// - Tip: console.log(data) first and read the shape.
// ==========================================
function displayWeather(data) {
    console.log(data); // Tip: read the shape

    cityName.textContent = `${data.name}, ${data.sys.country}`;
    weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    weatherIcon.alt = data.weather[0].description;
    
    temperature.textContent = `${Math.round(data.main.temp)}°C`;
    description.textContent = data.weather[0].description;
    feelsLike.textContent = `${Math.round(data.main.feels_like)}°C`;
    humidity.textContent = `${data.main.humidity}%`;
    wind.textContent = `${data.wind.speed} m/s`;
    pressure.textContent = `${data.main.pressure} hPa`;

    weatherDisplay.classList.remove("hidden");
}

// ==========================================
// STEP 4: recent searches in localStorage (a preview of Week 7)
// - loadRecent(): JSON.parse(localStorage.getItem("recent")) || [] (wrap in try/catch)
// - saveToHistory(city): put city first, remove any duplicate (ignore case), keep 5
// - renderHistory(): one <li><button class="history-item">city</button></li> per city
// ==========================================
function loadRecent() {
    try {
        return JSON.parse(localStorage.getItem("recent")) || [];
    } catch (e) {
        return [];
    }
}

function saveToHistory(city) {
    let recent = loadRecent();
    
    // remove any duplicate (ignore case) and put city first
    recent = recent.filter(item => item.toLowerCase() !== city.toLowerCase());
    recent.unshift(city);
    
    // keep 5
    recent = recent.slice(0, MAX_RECENT);
    
    localStorage.setItem("recent", JSON.stringify(recent));
}

function renderHistory() {
    const recent = loadRecent();
    historyList.innerHTML = "";
    
    recent.forEach(city => {
        const li = document.createElement("li");
        li.innerHTML = `<button class="history-item" type="button">${city}</button>`;
        historyList.appendChild(li);
    });
}

// ==========================================
// STEP 5: Events
// - submit on the form: preventDefault, trim, getWeather(city)
// - ONE click listener on historyList (delegation, Week 5):
//   const btn = event.target.closest(".history-item"); if (btn) getWeather(btn.textContent);
// ==========================================
form.addEventListener("submit", (event) => {
    event.preventDefault();
    const city = cityInput.value.trim();
    
    if (city) {
        getWeather(city);
        cityInput.value = ""; // Clear input after successful search
    }
});

historyList.addEventListener("click", (event) => {
    const btn = event.target.closest(".history-item");
    if (btn) {
        getWeather(btn.textContent);
    }
});

// Render history on page load
renderHistory();