const API_KEY = "bd5e378503939ddaee76f12ad7a97608";

const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const recentCities = document.getElementById("recentCities");
const recentWrapper = document.getElementById("recentWrapper");

const cityName = document.getElementById("cityName");
const currentDate = document.getElementById("currentDate");
const weatherDescription = document.getElementById("weatherDescription");
const weatherIcon = document.getElementById("weatherIcon");
const todayTemp = document.getElementById("todayTemp");
const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("windSpeed");
const feelsLike = document.getElementById("feelsLike");
const conditionMain = document.getElementById("conditionMain");
const forecastContainer = document.getElementById("forecastContainer");
const messageBox = document.getElementById("messageBox");
const customAlert = document.getElementById("customAlert");
const appBackground = document.getElementById("appBackground");

const celsiusBtn = document.getElementById("celsiusBtn");
const fahrenheitBtn = document.getElementById("fahrenheitBtn");

let currentUnit = "C";
let currentTempCelsius = null;
let currentFeelsLikeCelsius = null;

document.addEventListener("DOMContentLoaded", () => {
  loadRecentCities();
  updateUnitButtons();
});

searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (!city) {
    showMessage("Please enter a city name before searching.", "error");
    return;
  }
  fetchWeatherByCity(city);
});

cityInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    searchBtn.click();
  }
});

locationBtn.addEventListener("click", getWeatherByLocation);

recentCities.addEventListener("change", (event) => {
  const city = event.target.value;
  if (city) {
    fetchWeatherByCity(city, false);
  }
});

celsiusBtn.addEventListener("click", () => {
  currentUnit = "C";
  updateUnitButtons();
  updateTodayTemperatureOnly();
});

fahrenheitBtn.addEventListener("click", () => {
  currentUnit = "F";
  updateUnitButtons();
  updateTodayTemperatureOnly();
});

function updateUnitButtons() {
  if (currentUnit === "C") {
    celsiusBtn.className = "unit-btn rounded-2xl bg-sky-500 px-4 py-2.5 font-semibold text-white shadow-lg transition hover:bg-sky-600";
    fahrenheitBtn.className = "unit-btn rounded-2xl bg-white/10 px-4 py-2.5 font-semibold text-white shadow-lg transition hover:bg-white/20";
  } else {
    fahrenheitBtn.className = "unit-btn rounded-2xl bg-sky-500 px-4 py-2.5 font-semibold text-white shadow-lg transition hover:bg-sky-600";
    celsiusBtn.className = "unit-btn rounded-2xl bg-white/10 px-4 py-2.5 font-semibold text-white shadow-lg transition hover:bg-white/20";
  }
}

function showMessage(message, type = "info") {
  messageBox.textContent = message;
  messageBox.classList.remove("hidden");

  if (type === "error") {
    messageBox.className = "mb-6 rounded-2xl border border-red-300 bg-red-100 px-4 py-4 text-sm font-medium text-red-800 shadow-lg";
  } else if (type === "success") {
    messageBox.className = "mb-6 rounded-2xl border border-green-300 bg-green-100 px-4 py-4 text-sm font-medium text-green-800 shadow-lg";
  } else {
    messageBox.className = "mb-6 rounded-2xl border border-blue-300 bg-blue-100 px-4 py-4 text-sm font-medium text-blue-800 shadow-lg";
  }
}

function hideMessage() {
  messageBox.classList.add("hidden");
}

function showCustomAlert(message, type = "warning") {
  customAlert.textContent = message;
  customAlert.classList.remove("hidden");

  if (type === "danger") {
    customAlert.className = "mt-5 rounded-2xl border border-red-300 bg-red-100 px-4 py-4 font-semibold text-red-900 shadow-lg";
  } else if (type === "success") {
    customAlert.className = "mt-5 rounded-2xl border border-green-300 bg-green-100 px-4 py-4 font-semibold text-green-900 shadow-lg";
  } else {
    customAlert.className = "mt-5 rounded-2xl border border-yellow-300 bg-yellow-100 px-4 py-4 font-semibold text-yellow-900 shadow-lg";
  }
}

function hideCustomAlert() {
  customAlert.classList.add("hidden");
}

async function fetchWeatherByCity(city, saveToRecent = true) {
  hideMessage();
  hideCustomAlert();

  try {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;

    const [weatherResponse, forecastResponse] = await Promise.all([
      fetch(weatherUrl),
      fetch(forecastUrl)
    ]);

    if (!weatherResponse.ok) {
      throw new Error("City not found. Please enter a valid city name.");
    }

    if (!forecastResponse.ok) {
      throw new Error("Forecast data could not be loaded.");
    }

    const weatherData = await weatherResponse.json();
    const forecastData = await forecastResponse.json();

    displayCurrentWeather(weatherData);
    displayForecast(forecastData);
    updateBackground(weatherData.weather[0].main);

    if (saveToRecent) {
      saveRecentCity(weatherData.name);
    }

    showMessage(`Weather loaded successfully for ${weatherData.name}.`, "success");
  } catch (error) {
    clearWeatherUI();
    showMessage(error.message || "Something went wrong while fetching weather data.", "error");
  }
}

async function fetchWeatherByCoordinates(lat, lon) {
  hideMessage();
  hideCustomAlert();

  try {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

    const [weatherResponse, forecastResponse] = await Promise.all([
      fetch(weatherUrl),
      fetch(forecastUrl)
    ]);

    if (!weatherResponse.ok || !forecastResponse.ok) {
      throw new Error("Unable to fetch weather for your current location.");
    }

    const weatherData = await weatherResponse.json();
    const forecastData = await forecastResponse.json();

    displayCurrentWeather(weatherData);
    displayForecast(forecastData);
    updateBackground(weatherData.weather[0].main);
    saveRecentCity(weatherData.name);

    showMessage(`Current location weather loaded successfully.`, "success");
  } catch (error) {
    clearWeatherUI();
    showMessage(error.message || "Could not fetch weather for your location.", "error");
  }
}

function getWeatherByLocation() {
  if (!navigator.geolocation) {
    showMessage("Geolocation is not supported by your browser.", "error");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      fetchWeatherByCoordinates(latitude, longitude);
    },
    () => {
      showMessage("Location access denied. Please allow location permission and try again.", "error");
    }
  );
}

function displayCurrentWeather(data) {
  const now = new Date();
  const formattedDate = now.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  currentTempCelsius = data.main.temp;
  currentFeelsLikeCelsius = data.main.feels_like;

  cityName.textContent = `${data.name}, ${data.sys.country}`;
  currentDate.textContent = formattedDate;
  weatherDescription.textContent = data.weather[0].description;
  humidity.textContent = `${data.main.humidity}%`;
  windSpeed.textContent = `${data.wind.speed} m/s`;
  conditionMain.textContent = data.weather[0].main;

  weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
  weatherIcon.alt = data.weather[0].description;
  weatherIcon.classList.remove("hidden");

  updateTodayTemperatureOnly();
  feelsLike.textContent = `${Math.round(currentFeelsLikeCelsius)}°C`;

  checkExtremeTemperature(data.main.temp);
}

function updateTodayTemperatureOnly() {
  if (currentTempCelsius === null) {
    todayTemp.textContent = "--";
    return;
  }

  if (currentUnit === "C") {
    todayTemp.textContent = `${Math.round(currentTempCelsius)}°C`;
  } else {
    const tempFahrenheit = (currentTempCelsius * 9) / 5 + 32;
    todayTemp.textContent = `${Math.round(tempFahrenheit)}°F`;
  }
}

function checkExtremeTemperature(tempCelsius) {
  hideCustomAlert();

  if (tempCelsius > 40) {
    showCustomAlert(
      "Extreme heat alert: Temperature is above 40°C. Stay hydrated and avoid direct sun exposure.",
      "danger"
    );
  } else if (tempCelsius < 5) {
    showCustomAlert(
      "Cold weather alert: Temperature is very low. Wear warm clothes and stay protected.",
      "warning"
    );
  }
}

function displayForecast(data) {
  forecastContainer.innerHTML = "";

  const filteredForecasts = data.list.filter((item) => item.dt_txt.includes("12:00:00")).slice(0, 5);

  if (filteredForecasts.length === 0) {
    forecastContainer.innerHTML = `
      <div class="rounded-2xl border border-white/10 bg-white/5 p-4 text-slate-300">
        Forecast data is not available right now.
      </div>
    `;
    return;
  }

  filteredForecasts.forEach((item) => {
    const date = new Date(item.dt_txt);
    const formattedDay = date.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short"
    });

    const card = document.createElement("div");
    card.className = "rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl transition hover:-translate-y-1 hover:bg-white/10";

    card.innerHTML = `
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-sm uppercase tracking-[0.15em] text-sky-300">Day</p>
          <h4 class="mt-1 text-lg font-bold">${formattedDay}</h4>
        </div>
        <img
          src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png"
          alt="${item.weather[0].description}"
          class="h-16 w-16"
        />
      </div>

      <p class="mt-2 capitalize text-slate-300">${item.weather[0].description}</p>

      <div class="mt-4 space-y-2 text-sm text-slate-200">
        <p><span class="font-semibold">🌡 Temp:</span> ${Math.round(item.main.temp)}°C</p>
        <p><span class="font-semibold">💨 Wind:</span> ${item.wind.speed} m/s</p>
        <p><span class="font-semibold">💧 Humidity:</span> ${item.main.humidity}%</p>
      </div>
    `;

    forecastContainer.appendChild(card);
  });
}

function updateBackground(mainCondition) {
  const condition = mainCondition.toLowerCase();

  if (condition.includes("rain") || condition.includes("drizzle") || condition.includes("thunderstorm")) {
    appBackground.className = "min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-800 transition-all duration-500";
  } else if (condition.includes("clear")) {
    appBackground.className = "min-h-screen bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-700 transition-all duration-500";
  } else if (condition.includes("cloud")) {
    appBackground.className = "min-h-screen bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800 transition-all duration-500";
  } else if (condition.includes("snow")) {
    appBackground.className = "min-h-screen bg-gradient-to-br from-cyan-100 via-sky-200 to-slate-400 transition-all duration-500";
  } else if (condition.includes("mist") || condition.includes("haze") || condition.includes("fog")) {
    appBackground.className = "min-h-screen bg-gradient-to-br from-slate-500 via-slate-600 to-slate-700 transition-all duration-500";
  } else {
    appBackground.className = "min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 transition-all duration-500";
  }
}

function saveRecentCity(city) {
  let cities = JSON.parse(localStorage.getItem("recentCities")) || [];

  cities = cities.filter((savedCity) => savedCity.toLowerCase() !== city.toLowerCase());
  cities.unshift(city);

  if (cities.length > 5) {
    cities = cities.slice(0, 5);
  }

  localStorage.setItem("recentCities", JSON.stringify(cities));
  loadRecentCities();
}

function loadRecentCities() {
  const cities = JSON.parse(localStorage.getItem("recentCities")) || [];

  recentCities.innerHTML = `<option value="">Select a city</option>`;

  if (cities.length === 0) {
    recentWrapper.classList.add("hidden");
    return;
  }

  recentWrapper.classList.remove("hidden");

  cities.forEach((city) => {
    const option = document.createElement("option");
    option.value = city;
    option.textContent = city;
    recentCities.appendChild(option);
  });
}

function clearWeatherUI() {
  cityName.textContent = "No city selected";
  currentDate.textContent = "Search for a city to view weather details";
  weatherDescription.textContent = "";
  weatherIcon.src = "";
  weatherIcon.classList.add("hidden");
  todayTemp.textContent = "--";
  humidity.textContent = "--";
  windSpeed.textContent = "--";
  feelsLike.textContent = "--";
  conditionMain.textContent = "--";
  forecastContainer.innerHTML = "";
  currentTempCelsius = null;
  currentFeelsLikeCelsius = null;
  hideCustomAlert();
}