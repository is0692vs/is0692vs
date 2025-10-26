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
            clear: "Hello from the Big Apple! Beautiful sunny day☀️",
            clouds: "Hello from NYC! Cloudy skies today☁️",
            rain: "Hello from New York! Rainy day in the city☔",
            snow: "Hello from NYC! It's snowing❄️",
            default: "Hello from New York!",
        },
    },
    {
        city: "Los Angeles",
        country: "US",
        language: "English",
        greetings: {
            clear: "Hey from LA! Another perfect sunny day☀️",
            clouds: "Hey from LA! Rare cloudy weather today☁️",
            rain: "Hey from LA! Unusual rainy day☔",
            snow: "Hey from LA! Snow? That's rare❄️",
            default: "Hey from Los Angeles!",
        },
    },
    {
        city: "Chicago",
        country: "US",
        language: "English",
        greetings: {
            clear: "Greetings from the Windy City! Clear skies☀️",
            clouds: "Hi from Chicago! Cloudy day today☁️",
            rain: "Hello from Chicago! Rainy weather☔",
            snow: "Greetings from Chicago! Snowy day❄️",
            default: "Hello from Chicago!",
        },
    },
    {
        city: "San Francisco",
        country: "US",
        language: "English",
        greetings: {
            clear: "Hello from SF! What a beautiful sunny day☀️",
            clouds: "Hello from San Francisco! Foggy and cloudy☁️",
            rain: "Hello from SF! Rainy day in the bay☔",
            snow: "Hello from SF! Rare snow day❄️",
            default: "Hello from San Francisco!",
        },
    },
    {
        city: "Miami",
        country: "US",
        language: "English",
        greetings: {
            clear: "Hola from Miami! Sunny and warm☀️",
            clouds: "Hey from Miami! Partly cloudy today☁️",
            rain: "Hello from Miami! Tropical rain shower☔",
            snow: "Hi from Miami! Snow? Never happens❄️",
            default: "Hello from Miami!",
        },
    },
    {
        city: "Toronto",
        country: "CA",
        language: "English",
        greetings: {
            clear: "Hello from Toronto! Beautiful clear day☀️",
            clouds: "Hi from Toronto! Cloudy today☁️",
            rain: "Hello from Toronto! Rainy day☔",
            snow: "Greetings from Toronto! Snowy weather❄️",
            default: "Hello from Toronto!",
        },
    },
    {
        city: "Mexico City",
        country: "MX",
        language: "Español",
        greetings: {
            clear: "¡Hola desde la CDMX! Día soleado☀️",
            clouds: "¡Hola desde México! Está nublado☁️",
            rain: "¡Hola desde la CDMX! Está lloviendo☔",
            snow: "¡Hola desde México! Nieve rara❄️",
            default: "¡Hola desde Ciudad de México!",
        },
    },
    {
        city: "São Paulo",
        country: "BR",
        language: "Português",
        greetings: {
            clear: "Olá de São Paulo! Dia ensolarado☀️",
            clouds: "Oi de Sampa! Dia nublado☁️",
            rain: "Olá de São Paulo! Dia chuvoso☔",
            snow: "Oi de Sampa! Neve? Impossível❄️",
            default: "Olá de São Paulo!",
        },
    },
    {
        city: "Buenos Aires",
        country: "AR",
        language: "Español",
        greetings: {
            clear: "¡Hola desde Buenos Aires! Día soleado☀️",
            clouds: "¡Hola desde BA! Día nublado☁️",
            rain: "¡Hola desde Buenos Aires! Está lloviendo☔",
            snow: "¡Hola desde BA! Día con nieve❄️",
            default: "¡Hola desde Buenos Aires!",
        },
    },
    {
        city: "Paris",
        country: "FR",
        language: "Français",
        greetings: {
            clear: "Bonjour de Paris! Belle journée ensoleillée☀️",
            clouds: "Bonjour! Le ciel est nuageux à Paris☁️",
            rain: "Bonjour de Paris! Il pleut aujourd'hui☔",
            snow: "Bonjour! Il neige à Paris❄️",
            default: "Bonjour de Paris!",
        },
    },
    {
        city: "London",
        country: "GB",
        language: "English",
        greetings: {
            clear: "Hello from London! Lovely sunny weather☀️",
            clouds: "Hello from London! Rather cloudy today☁️",
            rain: "Hello from London! Typical rainy day☔",
            snow: "Hello from London! It's snowing❄️",
            default: "Hello from London!",
        },
    },
    {
        city: "Berlin",
        country: "DE",
        language: "Deutsch",
        greetings: {
            clear: "Hallo aus Berlin! Sonniger Tag☀️",
            clouds: "Hallo aus Berlin! Bewölkt heute☁️",
            rain: "Hallo aus Berlin! Es regnet☔",
            snow: "Hallo aus Berlin! Es schneit❄️",
            default: "Hallo aus Berlin!",
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
            clear: "G'day from Sydney! Beautiful sunny day☀️",
            clouds: "G'day from Sydney! Bit cloudy today☁️",
            rain: "G'day from Sydney! Rainy weather☔",
            snow: "G'day from Sydney! Snow? Very rare❄️",
            default: "G'day from Sydney!",
        },
    },
];
