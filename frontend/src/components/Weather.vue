<template lang="pug">
v-card(v-if="weather")
  v-card-text#weather(:class="weather.value?.main?.temp > 16 ? $t('weather.warm') : $t('weather.cold')")
    v-text-field.text-white(
      color="white"
      shaped
      variant="filled"
      :label="$t('weather.search')" 
      name='by_city' 
      v-model="query"
      @keyup.enter="fetchWeather"
    )
    .weather-wrap
      .location-box
        .location {{ weather.value.name }}, {{ weather.value.sys.country }}
        br
        .date {{ currentDate }}
      .weather-box(v-if="weather.value.main.temp")
        .temp {{ Math.round(weather.value.main.temp) }}&deg;c
        br
        .weather(v-if="settingsStore.settings")
          img(:src='`${settingsStore.settings.weatherIconUrl}${weather?.value?.weather[0]?.icon}.png`')
          span {{ weather.value.weather[0].description }}

</template>
<script setup lang="ts">
import { useOFetch } from "../plugins/ofetch";

interface Weather {
  value: {
    weather: [{ description: string; icon: string }];
    sys: {
      country: string;
    };
    main: {
      temp: number;
    };
    name: string;
  };
}
const settingsStore = useSettingsStore();
const messageStore = useMessageStore();
const query = ref("Paris");
const weather = ref<Weather | null>(null);

onMounted(() => {
  fetchWeather();
});

async function fetchWeather() {
  try {
    const response = await getWeather();
    weather.value = response.data;
  } catch (error) {
    if (error.status === "404") {
      messageStore.i18nMessage("error", "errors.server.notFound");
    } else {
      messageStore.i18nMessage("error", "errors.server.unexpected");
    }
  }
}

async function getWeather() {
  return await useOFetch(
    `${settingsStore.settings.weatherApiBaseUrl}weather?q=${query.value}&units=metric&appid=${settingsStore.settings.weatherApiKey}`,
    {
      method: "GET",
    },
  );
}

const currentDate = computed(() => {
  const date = new Date();
  return new Intl.DateTimeFormat("fr", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(date);
});
</script>

<style scoped>
#weather {
  background-size: cover;
  background-position: bottom;
  transition: 0.4s;
}
.warm {
  background-image: url("./src/assets/warm-bg.jpg");
}

.cold {
  background-image: url("./src/assets/cold-bg.jpg");
}

#weather v-card-text {
  /* min-height: 100vh; */
  padding: 25px;
  background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.25), rgba(0, 0, 0, 0.75));
}
.spinner-border {
  position: absolute;
  right: 5px;
  top: 35%;
}
.search-box {
  width: 100%;
  margin-bottom: 30px;
}
.search-box .search-bar {
  display: block;
  width: 100%;
  padding: 15px;
  color: #313131;
  font-size: 20px;
  appearance: none;
  border: none;
  outline: none;
  background: none;
  box-shadow: 0px 0px 8px rgba(0, 0, 0, 0.25);
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 0px 16px 0px 16px;
  transition: 0.4s;
}
.search-box .search-bar:focus {
  box-shadow: 0px 0px 16px rgba(0, 0, 0, 0.25);
  background-color: rgba(255, 255, 255, 0.75);
  border-radius: 16px 0px 16px 0px;
}
.location-box .location {
  color: #fff;
  font-size: 32px;
  font-weight: 500;
  text-align: center;
  text-shadow: 1px 3px rgba(0, 0, 0, 0.25);
}
.location-box .date {
  color: #fff;
  font-size: 20px;
  font-weight: 300;
  font-style: italic;
  text-align: center;
}
.weather-box {
  text-align: center;
}
.weather-box .temp {
  display: inline-block;
  padding: 10px 25px;
  color: #fff;
  font-size: 102px;
  font-weight: 900;
  text-shadow: 3px 6px rgba(0, 0, 0, 0.25);
  border-radius: 16px;
  margin: 30px 0px;
}
.weather-box .weather {
  color: #fff;
  font-size: 48px;
  font-weight: 700;
  font-style: italic;
  text-shadow: 3px 6px rgba(0, 0, 0, 0.25);
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
