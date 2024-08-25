import "./App.css";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaSpinner } from "react-icons/fa";

function App() {
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [currentDate, setCurrentDate] = useState("");
  const [city, setCity] = useState("");
  const [error, setError] = useState("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [loading, setLoading] = useState(false);
  const apikey = "b1b89674761bd3c540eb42e4a0e9b09c"; // OpenWeatherMap API

  useEffect(() => {
    const handleOnlineStatus = () => setIsOnline(navigator.onLine);

    window.addEventListener("online", handleOnlineStatus);
    window.addEventListener("offline", handleOnlineStatus);

    return () => {
      window.removeEventListener("online", handleOnlineStatus);
      window.removeEventListener("offline", handleOnlineStatus);
    };
  }, []);

  useEffect(() => {
    const currentDate = new Date();
    const options = { weekday: "long", day: "numeric", month: "long" };
    setCurrentDate(currentDate.toLocaleDateString("en-US", options));
  }, []);

  const fetchWeatherData = async () => {
    if (!isOnline) {
      setError("Please connect to the internet and try again.");
      return;
    }

    if (!city.trim()) return;

    setLoading(true);
    setError(""); // Clear any previous errors

    setWeatherData(null);
    setForecastData(null);

    try {
      // Current weather data
      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apikey}`;
      const weatherResponse = await axios.get(weatherUrl);
      setWeatherData(weatherResponse.data);

      // Forecast data
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apikey}`;
      const forecastResponse = await axios.get(forecastUrl);
      setForecastData(forecastResponse.data);
    } catch (error) {
      setError("City not found. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setCity(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchWeatherData();
  };

  const kelvinToCelsius = (kelvin) => kelvin - 273.15;

  const mpsToMph = (mps) => mps * 2.23694;

  const convertTime = (timestamp, offset) => {
    const date = new Date((timestamp + offset) * 1000);
    let hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const meridiem = hours >= 12 ? "PM" : "AM";
    hours %= 12;
    hours = hours || 12;
    const formattedTime = `${hours}:${minutes < 10 ? "0" : ""}${minutes} ${meridiem}`;
    return formattedTime;
  };

  const getWeatherType = () => {
    if (!weatherData || !weatherData.weather)
      return "The weather type cannot be determined";

    const weatherDescription = weatherData.weather[0].description.toLowerCase();
    if (
      weatherDescription.includes("rain") ||
      weatherDescription.includes("drizzle")
    ) {
      return "Rain";
    } else {
      return "Light";
    }
  };

  // Daily forecast data
  const getDailyForecast = () => {
    if (!forecastData) return [];
  
    const dailyForecast = {};
    const today = new Date().toLocaleDateString(); // Get today's date
  
    forecastData.list.forEach((entry) => {
      const date = new Date(entry.dt * 1000).toLocaleDateString();
      if (date === today) return; // Skip today's forecast
  
      if (!dailyForecast[date]) {
        dailyForecast[date] = {
          temp: 0,
          humidity: 0,
          count: 0,
          weather: entry.weather[0].description,
        };
      }
      dailyForecast[date].temp += entry.main.temp;
      dailyForecast[date].humidity += entry.main.humidity;
      dailyForecast[date].count++;
    });
  
    return Object.keys(dailyForecast).map((date) => ({
      date,
      temp: kelvinToCelsius(
        dailyForecast[date].temp / dailyForecast[date].count
      ).toFixed(2),
      humidity: (
        dailyForecast[date].humidity / dailyForecast[date].count
      ).toFixed(2),
      weather: dailyForecast[date].weather,
    }));
  };

  return (
    <div className="App">
      <h1 className="title">AellaWeather</h1>
      <form className="center" onSubmit={handleSubmit}>
        <input
          className="input"
          type="text"
          name="city"
          placeholder={weatherData ? city : "Enter the city..."}
          value={city}
          onChange={handleInputChange}
        />
        <button className="search-button" type="submit">
          Search
        </button>
      </form>

      {loading && (
        <div className="loading-container">
          <FaSpinner className="spinner" />
          <p className="loading-message">Loading...</p>
        </div>
      )}
      {!loading && error && <p className="error">{error}</p>}
      {weatherData && (
        <div className="container">
          <div className="left">
            <h2>
              {weatherData.name}, {weatherData.sys.country}
            </h2>
            <p>{currentDate}</p>
          </div>
          <div className="right">
            <div>
              <p>Weather</p>
              <span>{getWeatherType()}</span>
            </div>
            <div>
              <p>{mpsToMph(weatherData.wind.speed).toFixed(2)} mph</p>
              <span>Wind Speed</span>
            </div>
            <div>
              <p>{convertTime(weatherData.sys.sunrise, weatherData.timezone)}</p>
              <span>Sunrise</span>
            </div>
            <div>
              <p>{convertTime(weatherData.sys.sunset, weatherData.timezone)}</p>
              <span>Sunset</span>
            </div>
            <div>
              <p>{weatherData.wind.deg}°</p>
              <span>Wind Direction</span>
            </div>
            <div>
              <p>{weatherData.weather[0].main}</p>
              <span>Weather</span>
            </div>
            <div>
              <p>{weatherData.main.humidity}%</p>
              <span>Humidity</span>
            </div>
            <div>
              <p>{weatherData.main.pressure} hPa</p>
              <span>Pressure</span>
            </div>
          </div>
          <div className="temp">
            <div className="sub-temp">
              <img src="./cloud.png" alt="temp" />
              <p>{kelvinToCelsius(weatherData.main.temp).toFixed(2)} °C</p>
            </div>
          </div>
        </div>
      )}

      {forecastData && (
        <div className="forecast-container flex flex-row flex-wrap">
          <h2>5-Day Forecast</h2>
          <div className="forecast">
            {getDailyForecast()
              .slice(0, 5)
              .map((forecast) => (
                <div key={forecast.date} className="forecast-item">
                  <p>{forecast.date}</p>
                  <p>Temp: {forecast.temp} °C</p>
                  <p>Humidity: {forecast.humidity} %</p>
                  <p>{forecast.weather}</p>
                </div>
              ))}
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
