<template lang="pug">
v-card
  v-card-text#weather(:class="weather.value && weather.value.main.temp > 16 ? 'warm' : 'cold'")
    v-text-field.text-white(
      color="white"
      shaped
      variant="filled"
      label="Search for a city then press enter..." 
      name='by_city' 
      @blur='filterAll(itemName, true)' 
      v-model="query"
      @keyup.enter="fetchWeather"
    )
    .weather-wrap(v-if="weather.value")
      .location-box
        .location {{ weather.value.name }}, {{ weather.value.sys.country }}
        br
        .date {{ dateBuilder() }}
      .weather-box(v-if="weather.value.main.temp")
        .temp {{ Math.round(weather.value.main.temp) }}&deg;c
        br
        .weather
          img(:src='icon')
          span {{ weather.value.weather[0].description }}

    .weather-wrap(v-if="errorMessage")
      .location-box
        .location {{ errorMessage }}

</template>
<script setup lang="ts">
import axios from "axios";

interface Weather {
  value: {
    weather: [{ description: string }];
    sys: {
      country: string;
    };
    main: {
      temp: number;
    };
    name: string;
  };
}

const api_key = <string>"1c2e74ddb4456f75a4a48d61a368203b";
const api_base_url = <string>"https://api.openweathermap.org/data/2.5/";
const query = ref("Paris");
const weather = reactive<Weather | any>({});
const errorMessage = ref("");
const icon = computed((): string => `http://openweathermap.org/img/w/${weather?.value?.weather[0]?.icon}.png`);
const indexStore = useIndexStore();

fetchWeather();

async function fetchWeather() {
  indexStore.setLoading(true);
  try {
    const response = await getWeather();
    weather.value = response.data;
  } catch (error: any) {
    if (error.status === "404") {
      errorMessage.value = "Aucun résultat trouvé";
    } else {
      errorMessage.value = "Une erreur s'est produite";
    }
    weather.value = {};
  } finally {
    indexStore.setLoading(false);
    errorMessage.value = "";
  }
}

function getWeather() {
  return axios.get(`${api_base_url}weather?q=${query.value}&units=metric&appid=${api_key}`);
}

function dateBuilder() {
  const date = new Date();
  return new Intl.DateTimeFormat("fr", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(date);
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
body {
  font-family: "montserrat", sans-serif;
}
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
