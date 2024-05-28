//! https://medium.com/@ismalinggazein/openai-function-calling-integrating-external-weather-api-6935e5d701d3
import { Tool } from "./index";
import { z } from "zod";
import { getPreferenceValues } from "@raycast/api";

const schema = z.object({
  location: z.string().describe("The city and state english name(other language not support), e.g. San Francisco, anhui"),
});

type Infer = z.infer<typeof schema>;

export default class WeatherTool implements Tool<Infer> {
  async execute(input: Infer) {
    const { openweatherApiKey: API_KEY } = getPreferenceValues<Preferences.Ask>();
    if (!API_KEY) {
      throw new Error("OpenWeatherMap API key is not set");
    }
    const location = input.location;
    return await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${ location }&appid=${ API_KEY }`, {
      method: "GET"
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        const kelvin_temp = data.main.temp;
        const celsius_temp = kelvin_temp - 273.15;
        return `The weather in ${ location } is ${ celsius_temp }°C, weather description is ${data.weather[0].description}`;
      }).catch((err) => {
        console.error(err);
        return "No data";
      });
  }

  define() {
    return {
      name: "get_current_weather",
      description: "Get the current weather in a given location",
      schema,
    };
  }
}
