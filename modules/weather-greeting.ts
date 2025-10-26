import { weatherCities, type CityConfig } from "../config/weather-cities";
import { openWeatherConfig } from "../config/openweather";

interface ForecastItem {
    dt: number;
    main: { temp: number };
    weather: Array<{ main: string; description: string }>;
    dt_txt: string;
}

interface ForecastData {
    list: ForecastItem[];
    city: { name: string };
}

// ランダムに都市を選択
function getRandomCity(): CityConfig {
    const randomIndex = Math.floor(Math.random() * weatherCities.length);
    return weatherCities[randomIndex];
}

// OpenWeather APIから天気予報を取得（昼間の予報を優先）
async function fetchWeather(
    city: string,
    country: string
): Promise<ForecastItem | null> {
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

        const data = (await response.json()) as ForecastData;

        // 今日の昼間（12:00-15:00）の予報を探す
        const now = new Date();
        const today = now.toISOString().split("T")[0]; // YYYY-MM-DD

        // 昼間の予報を優先的に探す（12:00-15:00）
        const daytimeForecast = data.list.find((item) => {
            const forecastDate = item.dt_txt.split(" ")[0];
            const forecastTime = item.dt_txt.split(" ")[1];
            const hour = parseInt(forecastTime.split(":")[0]);

            return forecastDate === today && hour >= 12 && hour <= 15;
        });

        // 昼間の予報がなければ、今日の最初の予報を使う
        const selectedForecast =
            daytimeForecast ||
            data.list.find((item) => item.dt_txt.startsWith(today)) ||
            data.list[0];

        return selectedForecast;
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

        // 天気予報を取得
        const forecastData = await fetchWeather(
            selectedCity.city,
            selectedCity.country
        );

        // 天気情報が取得できなかった場合のフォールバック
        if (!forecastData) {
            return `# 🌍 ${selectedCity.greetings.default}\n📍 ${selectedCity.city}`;
        }

        // 天気に応じた挨拶を生成
        const greeting = getGreetingByWeather(
            forecastData.weather[0].main,
            selectedCity
        );

        // 気温を整数に丸める
        const temperature = Math.round(forecastData.main.temp);

        // マークダウン形式で返す
        return `# 🌍 ${greeting}\n📍 ${selectedCity.city}: ${temperature}°C`;
    } catch (error) {
        console.error("Error in weatherGreeting:", error);

        // エラー時のフォールバック
        const fallbackCity = getRandomCity();
        return `# 🌍 ${fallbackCity.greetings.default}\n📍 ${fallbackCity.city}`;
    }
}
