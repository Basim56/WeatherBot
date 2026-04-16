import axios from "axios";
import { AppError } from "../utils/app-error.js";

const API_KEY = process.env.OPENWEATHER_API_KEY;
const WEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";

const getCurrentWeather = async (city) => {
  try {
    const response = await axios.get(`${WEATHER_BASE_URL}/weather`, {
      params: {
        q: city,
        appid: API_KEY,
        units: "metric",
      },
    });

    const data = response.data;

    return {
      temp: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      description: data.weather[0].description,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
    };
  } catch (error) {
    if (error.response?.status === 404) {
      throw new AppError(
        `City "${city}" not found. Please check the city name.`,
        404,
      );
    }
    console.log(error, "Error in getCurrentWeather");
    throw new AppError("Failed to fetch current weather data.", 500);
  }
};

const getForecastWeather = async (city, dateParam = null) => {
  try {
    const startDate = dateParam ? new Date(dateParam) : new Date();
    startDate.setHours(0, 0, 0, 0); // ✅ normalize to midnight to avoid time comparison issues

    const forecastResponse = await axios.get(`${WEATHER_BASE_URL}/forecast`, {
      params: { q: city, appid: API_KEY, units: "metric", cnt: 40 },
    });

    const groupedByDay = {};
    forecastResponse.data.list.forEach((item) => {
      const date = new Date(item.dt * 1000).toDateString();
      if (!groupedByDay[date])
        groupedByDay[date] = { temps: [], descriptions: [] };
      groupedByDay[date].temps.push(item.main.temp);
      groupedByDay[date].descriptions.push(item.weather[0].description);
    });

    const forecasts = Object.entries(groupedByDay).map(([date, values]) => ({
      date,
      minTemp: Math.round(Math.min(...values.temps)),
      maxTemp: Math.round(Math.max(...values.temps)),
      description: values.descriptions[0],
    }));

    let filtered = forecasts
      .filter((day) => {
        const d = new Date(day.date);
        d.setHours(0, 0, 0, 0);
        return d >= startDate;
      })
      .slice(0, 5);

    // ✅ Fallback: if requested date is beyond available data, return full forecast
    if (filtered.length === 0) {
      filtered = forecasts.slice(0, 5);
    }

    return { forecasts: filtered, requestedDate: dateParam };
  } catch (error) {
    console.log(error, "Error");
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to fetch forecast data.", 500);
  }
};
export { getCurrentWeather, getForecastWeather };
