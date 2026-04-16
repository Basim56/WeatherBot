import {
  getCurrentWeather,
  getForecastWeather,
} from "../service/weather-service.js";
import { AppError } from "../utils/app-error.js";

const handleWebhook = async (req, res, next) => {
  try {
    console.log("Webhook hit");
    console.log("Body:", JSON.stringify(req.body, null, 2)); // 👈 add this
    const intentName = req.body.queryResult.intent.displayName;
    const parameters = req.body.queryResult.parameters;

    const rawCity = parameters["geo-city"];
    const city = Array.isArray(rawCity) ? rawCity[0] : rawCity;
    const dateParam = parameters["date"] || null;
    console.log(intentName, "intent name");
    let fulfillmentText = "";

    if (intentName === "Get Current Weather") {
      const data = await getCurrentWeather(city);
      fulfillmentText = formatCurrentWeather(city, data);
    } else if (intentName === "Get Weather Forecast") {
      const data = await getForecastWeather(city, dateParam);
      fulfillmentText = formatForecast(city, data, dateParam);
    } else {
      throw new AppError("Intent not recognized.", 400);
    }

    res.json({ fulfillmentText });
  } catch (err) {
    next(err);
  }
};

const formatCurrentWeather = (city, data) => {
  return (
    `The current weather in ${city}:\n` +
    `🌡 Temperature: ${data.temp}°C (feels like ${data.feelsLike}°C)\n` +
    `🌤 Condition: ${data.description}\n` +
    `💧 Humidity: ${data.humidity}%\n` +
    `🌬 Wind: ${data.windSpeed} m/s`
  );
};

const formatForecast = (city, result, dateParam) => {
  const { forecasts, requestedDate } = result;

  if (!forecasts || forecasts.length === 0) {
    return `Sorry, no forecast data is available for ${city}.`;
  }

  const startDate = forecasts[0].date;
  const endDate = forecasts[forecasts.length - 1].date;

  let response = "";

  // ✅ Warn if we couldn't honor the requested date
  // if (forecasts.length <= 2 && requestedDate) {
  //   response += `⚠️ Limited data available from your requested date (free plan covers 5 days ahead).\n\n`;
  // }

  response += `Forecast from ${startDate} to ${endDate} for ${city}:\n\n`;

  forecasts.forEach((day) => {
    response += `📅 ${day.date}\n`;
    response += `   🌡 ${day.minTemp}°C - ${day.maxTemp}°C\n`;
    response += `   🌤 ${day.description}\n\n`;
  });

  return response;
};

export { handleWebhook };
