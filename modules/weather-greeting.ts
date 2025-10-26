import { weatherCities, type CityConfig } from "../config/weather-cities";
import { openWeatherConfig } from "../config/openweather";

interface WeatherData {
    weather: Array<{ main: string; description: string }>;
    main: { temp: number };
    name: string;
}

// ランダムに都市を選択
function getRandomCity(): CityConfig {
    const randomIndex = Math.floor(Math.random() * weatherCities.length);
    return weatherCities[randomIndex];
}

// OpenWeather APIから天気情報を取得
async function fetchWeather(
    city: string,
    country: string
): Promise<WeatherData | null> {
    const { apiKey, baseUrl } = openWeatherConfig;

    if (!apiKey) {
        console.warn("OpenWeather API key is not set");
        return null;
    }

    try {
        const url = `${baseUrl}?q=${encodeURIComponent(city)},${country}&appid=${apiKey}&units=metric`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒タイムアウト

        const response = await fetch(url, {
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.warn(
                `Failed to fetch weather: ${response.status} ${response.statusText}`
            );
            return null;
        }

        const data = (await response.json()) as WeatherData;
        return data;
    } catch (error) {
        if (error instanceof Error) {
            if (error.name === "AbortError") {
                console.warn("Weather API request timed out");
            } else {
                console.warn(`Error fetching weather: ${error.message}`);
            }
        }
        return null;
    }
}

// 天気状態に応じた挨拶を取得
function getGreetingByWeather(
    weather: string,
    cityConfig: CityConfig
): string {
    const weatherLower = weather.toLowerCase();

    if (weatherLower === "clear") {
        return cityConfig.greetings.clear;
    } else if (weatherLower === "clouds") {
        return cityConfig.greetings.clouds;
    } else if (
        weatherLower === "rain" ||
        weatherLower === "drizzle" ||
        weatherLower === "thunderstorm"
    ) {
        return cityConfig.greetings.rain;
    } else if (weatherLower === "snow") {
        return cityConfig.greetings.snow;
    } else {
        return cityConfig.greetings.default;
    }
}

// メイン関数: 天気挨拶を生成
export async function weatherGreeting(): Promise<string> {
    try {
        // ランダムに都市を選択
        const selectedCity = getRandomCity();

        // 天気情報を取得
        const weatherData = await fetchWeather(
            selectedCity.city,
            selectedCity.country
        );

        // 天気情報が取得できなかった場合のフォールバック
        if (!weatherData) {
            return `# 🌍 ${selectedCity.greetings.default}\n📍 ${selectedCity.city}`;
        }

        // 天気に応じた挨拶を生成
        const greeting = getGreetingByWeather(
            weatherData.weather[0].main,
            selectedCity
        );

        // 気温を整数に丸める
        const temperature = Math.round(weatherData.main.temp);

        // マークダウン形式で返す
        return `# 🌍 ${greeting}\n📍 ${weatherData.name}: ${temperature}°C`;
    } catch (error) {
        console.error("Error in weatherGreeting:", error);

        // エラー時のフォールバック
        const fallbackCity = getRandomCity();
        return `# 🌍 ${fallbackCity.greetings.default}\n📍 ${fallbackCity.city}`;
    }
}
