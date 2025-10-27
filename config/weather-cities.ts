export interface CityConfig {
    city: string;
    country: string; // ISO 3166 country code
    language: string;
    greetings: {
        clear: string;
        clouds: string;
        rain: string;
        snow: string;
        default: string;
    };
}

export const weatherCities: CityConfig[] = [
    {
        city: "Osaka",
        country: "JP",
        language: "日本語",
        greetings: {
            clear: "こんにちは！素晴らしい晴れですね☀️",
            clouds: "こんにちは！今日は曇り空ですね☁️",
            rain: "こんにちは！雨の日ですね☔",
            snow: "こんにちは！雪が降っていますね❄️",
            default: "こんにちは！",
        },
    },
    {
        city: "New York",
        country: "US",
        language: "English",
        greetings: {
            clear: "Hello! Beautiful sunny day☀️",
            clouds: "Hello! Cloudy skies today☁️",
            rain: "Hello! Rainy day☔",
            snow: "Hello! It's snowing❄️",
            default: "Hello!",
        },
    },
    {
        city: "Los Angeles",
        country: "US",
        language: "English",
        greetings: {
            clear: "Hello! Perfect sunny day☀️",
            clouds: "Hello! Cloudy weather today☁️",
            rain: "Hello! Rainy day☔",
            snow: "Hello! Snowing❄️",
            default: "Hello!",
        },
    },
    {
        city: "Chicago",
        country: "US",
        language: "English",
        greetings: {
            clear: "Hello! Clear skies today☀️",
            clouds: "Hello! Cloudy day☁️",
            rain: "Hello! Rainy weather☔",
            snow: "Hello! Snowy day❄️",
            default: "Hello!",
        },
    },
    {
        city: "San Francisco",
        country: "US",
        language: "English",
        greetings: {
            clear: "Hello! Beautiful sunny day☀️",
            clouds: "Hello! Foggy and cloudy☁️",
            rain: "Hello! Rainy day☔",
            snow: "Hello! Snowing❄️",
            default: "Hello!",
        },
    },
    {
        city: "Miami",
        country: "US",
        language: "English",
        greetings: {
            clear: "Hello! Sunny and warm☀️",
            clouds: "Hello! Partly cloudy today☁️",
            rain: "Hello! Tropical rain shower☔",
            snow: "Hello! Snowing❄️",
            default: "Hello!",
        },
    },
    {
        city: "Toronto",
        country: "CA",
        language: "English",
        greetings: {
            clear: "Hello! Beautiful clear day☀️",
            clouds: "Hello! Cloudy today☁️",
            rain: "Hello! Rainy day☔",
            snow: "Hello! Snowy weather❄️",
            default: "Hello!",
        },
    },
    {
        city: "Mexico City",
        country: "MX",
        language: "Español",
        greetings: {
            clear: "¡Hola! Día soleado☀️",
            clouds: "¡Hola! Está nublado☁️",
            rain: "¡Hola! Está lloviendo☔",
            snow: "¡Hola! Nevando❄️",
            default: "¡Hola!",
        },
    },
    {
        city: "São Paulo",
        country: "BR",
        language: "Português",
        greetings: {
            clear: "Olá! Dia ensolarado☀️",
            clouds: "Olá! Dia nublado☁️",
            rain: "Olá! Dia chuvoso☔",
            snow: "Olá! Nevando❄️",
            default: "Olá!",
        },
    },
    {
        city: "Buenos Aires",
        country: "AR",
        language: "Español",
        greetings: {
            clear: "¡Hola! Día soleado☀️",
            clouds: "¡Hola! Día nublado☁️",
            rain: "¡Hola! Está lloviendo☔",
            snow: "¡Hola! Día con nieve❄️",
            default: "¡Hola!",
        },
    },
    {
        city: "Madrid",
        country: "ES",
        language: "Español",
        greetings: {
            clear: "¡Hola! Día soleado☀️",
            clouds: "¡Hola! Día nublado☁️",
            rain: "¡Hola! Está lloviendo☔",
            snow: "¡Hola! Nevando❄️",
            default: "¡Hola!",
        },
    },
    {
        city: "Barcelona",
        country: "ES",
        language: "Español",
        greetings: {
            clear: "¡Hola! Día soleado☀️",
            clouds: "¡Hola! Día nublado☁️",
            rain: "¡Hola! Día lluvioso☔",
            snow: "¡Hola! Nevando❄️",
            default: "¡Hola!",
        },
    },
    {
        city: "Bogotá",
        country: "CO",
        language: "Español",
        greetings: {
            clear: "¡Hola! Día soleado☀️",
            clouds: "¡Hola! Día nublado☁️",
            rain: "¡Hola! Está lloviendo☔",
            snow: "¡Hola! Nevando❄️",
            default: "¡Hola!",
        },
    },
    {
        city: "Lima",
        country: "PE",
        language: "Español",
        greetings: {
            clear: "¡Hola! Día soleado☀️",
            clouds: "¡Hola! Día nublado☁️",
            rain: "¡Hola! Está lloviendo☔",
            snow: "¡Hola! Nevando❄️",
            default: "¡Hola!",
        },
    },
    {
        city: "Paris",
        country: "FR",
        language: "Français",
        greetings: {
            clear: "Bonjour! Belle journée ensoleillée☀️",
            clouds: "Bonjour! Le ciel est nuageux☁️",
            rain: "Bonjour! Il pleut aujourd'hui☔",
            snow: "Bonjour! Il neige❄️",
            default: "Bonjour!",
        },
    },
    {
        city: "London",
        country: "GB",
        language: "English",
        greetings: {
            clear: "Hello! Lovely sunny weather☀️",
            clouds: "Hello! Rather cloudy today☁️",
            rain: "Hello! Rainy day☔",
            snow: "Hello! It's snowing❄️",
            default: "Hello!",
        },
    },
    {
        city: "Berlin",
        country: "DE",
        language: "Deutsch",
        greetings: {
            clear: "Hallo! Sonniger Tag☀️",
            clouds: "Hallo! Bewölkt heute☁️",
            rain: "Hallo! Es regnet☔",
            snow: "Hallo! Es schneit❄️",
            default: "Hallo!",
        },
    },
    {
        city: "Seoul",
        country: "KR",
        language: "한국어",
        greetings: {
            clear: "안녕하세요! 맑은 날씨네요☀️",
            clouds: "안녕하세요! 오늘은 흐린 날씨네요☁️",
            rain: "안녕하세요! 비가 오는 날이네요☔",
            snow: "안녕하세요! 눈이 오네요❄️",
            default: "안녕하세요!",
        },
    },
    {
        city: "Sydney",
        country: "AU",
        language: "English",
        greetings: {
            clear: "G'day! Beautiful sunny day☀️",
            clouds: "G'day! Bit cloudy today☁️",
            rain: "G'day! Rainy weather☔",
            snow: "G'day! Snowing❄️",
            default: "G'day!",
        },
    },
];
