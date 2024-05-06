<template>

  <v-container fluid style="padding-left: 100px; padding-right: 100px">

    <!-- Titolo -->
    <v-row class="justify-center">
      <v-card class="big-card">
        <v-card-title class="text-center title big-title">
          Radio Player Italia
          <img src="../../img/italy.png" alt="Italian Flag" class="flag"
            style="width:30px; border: 2px solid white; border-radius: 100%">
        </v-card-title>
      </v-card>
    </v-row>

    <!-- Filtro -->
    <v-row style="width:800px" align="center" justify="center">
      <v-btn-toggle v-model="toggle" divided class="margin">
        <v-btn variant="tonal" class="filter custom-disabled gray-icon" icon="mdi-filter" disabled></v-btn>
        <v-btn variant="tonal" class="filter" icon="mdi-radio" @click="FilterMode('all')"></v-btn>
        <v-btn variant="tonal" class="filter" icon="mdi-heart" @click="FilterMode('favorite')"></v-btn>
      </v-btn-toggle>

      <v-combobox clearable v-model="selectedTags" :items="uniqueTags" label="Filtra per tag" multiple
        @change="ManageTagsFilter" class="margin" style="width:200px" density="comfortable"
        placeholder="Scrivi un tag..."></v-combobox>

    </v-row>



    <!-- Radio -->
    <v-row>

      <v-col v-for="item in filteredRadios" :key="item.name" cols="12" sm="6" md="4" lg="3" xl="2">
        <v-card class="card d-flex flex-column">

          <v-card-title>
            <b>{{ item.name }}</b>
          </v-card-title>

          <v-card-text style="font-size: 10px;">
            <a :href="item.homepage" target="_blank">{{ item.homepage }}</a>
          </v-card-text>

          <v-card-text style="font-size: 10px; margin:0;padding:0">
            {{ item.tags.split(',').slice(0, 5).join(',') }}
          </v-card-text>

          <v-card-item class="flex-grow-1">
            <img :src="item.favicon" v-if="item.favicon" class="favicon">
            <span v-else>
              <img :src="require('../../img/defaultradioimage.png')" class="favicon">
            </span>
          </v-card-item>

          <v-card-item class="mt-auto">
            <div style="display: flex; justify-content: space-between; align-items: center;">

              <div id="buttonplay" style="flex-grow: 1;">
                <v-btn block :color="activeRadio === item.name ? 'red' : 'blue'" variant="tonal"
                  @click="activeRadio === item.name ? StopAudio() : PlayAudio(item)">{{ activeRadio === item.name ?
                    'FERMA' : 'SUONA' }}</v-btn>
              </div>

              <div id="favoriteButton" style="flex-grow: 1;">
                <v-btn block :color="isFavorite(item) ? 'red' : 'gray'" @click="addFavorite(item)">
                  <v-icon>mdi-heart</v-icon>
                </v-btn>
              </div>

              <div id="player" style="flex-grow: 1;">
                <!-- Here will be the audio player -->
              </div>

            </div>
          </v-card-item>

        </v-card>
      </v-col>

    </v-row>
  </v-container>
</template>

<style scoped>
.card {
  height: 350px;
  margin-right: 10px;
}

.margin {
  margin: 20px;
}

.favicon {
  width: 150px;
  border: 5px solid black;
  border-radius: 40px;
  margin: 0;
}

.v-btn {
  margin: 10px;
}

.filter {
  padding: 0;
  margin: 0;
}

.custom-disabled {
  opacity: 0.6;
  pointer-events: none;
}

.gray-icon .v-icon {
  color: #888;
}

.big-title {
  font-size: 36px;
}
</style>

<script>
const Hls = require('hls.js');

export default {

  name: 'HomeView',
  data() {
    return {
      radios: [],
      isPlaying: false,
      activeRadio: null,
      currentLocation: null,
      favoriteRadios: [],
      tagfilterRadios: [],
      showFilter: "all",
      selectedTags: [],
    }
  },

  methods: {

    getRadios() {

      if (localStorage.getItem('radios')) {
        this.radios = JSON.parse(localStorage.getItem('radios'));
        console.log(this.radios);
        return;
      }

      fetch('https://nl1.api.radio-browser.info/json/stations/search?limit=200&countrycode=IT&hidebroken=true&order=clickcount&reverse=true')
        .then(response => response.json())
        .then(data => {
          this.radios = data;
          this.removeDuplicateRadios(this.radios);
          this.saveInLocalStorage();
          console.log(this.radios);
        })
        .catch(error => {
          console.error('ERRORE! Ecco Cosa Non Va :) \n\n', error);
        });

    },

    getAudioFormat(url) {
      var extension = url.split('.').pop();
      return extension;
    },

    saveInLocalStorage() {
      localStorage.setItem('radios', JSON.stringify(this.radios));
    },

    PlayAudio(item) {
      const url = item.url;
      const audioFormat = this.getAudioFormat(url);
      console.log(audioFormat);

      //in questo momento non mi serve, per non sprecare chiamate API
      //this.getLocation(item.state);

      if (audioFormat.startsWith('it:8000')) {
        alert("Il formato 'it:8000' non è supportato");
        return;
      }

      else if (audioFormat === 'm3u8') {
        if (Hls.isSupported()) {
          var audio = document.getElementById('audioPlayer');
          var hls = new Hls();
          hls.loadSource(url);
          hls.attachMedia(audio);
          hls.on(Hls.Events.MANIFEST_PARSED, function () { audio.play(); });
        }
      }

      else {
        var code = '<audio id="audioPlayer" controls autoplay style="display:none"><source src="' + url + '" type="audio/mpeg"></audio>'
        document.getElementById("player").innerHTML = code;
      }

      this.isPlaying = true;
      this.activeRadio = item.name;
    },

    StopAudio() {
      var audio = document.getElementById('audioPlayer');
      if (audio) { audio.pause(); }

      this.isPlaying = false;
      this.activeRadio = null;
    },

    getLocation(state) {

      fetch('https://api.api-ninjas.com/v1/geocoding?city=' + state, {
        headers: { 'X-Api-Key': process.env.VUE_APP_GEOCODING_API_KEY }
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(result => {
          this.currentLocation = { latitude: result[0].latitude, longitude: result[0].longitude };
          console.log(this.currentLocation);
        })
        .catch(error => {
          console.error('Error:', error);
        });

    },

    isFavorite(radio) {
      return this.favoriteRadios.some(favRadio => favRadio.name === radio.name);
    },

    addFavorite(radio) {
      const existingRadio = this.favoriteRadios.find(favRadio => favRadio.name === radio.name);
      if (!existingRadio) {
        this.favoriteRadios.push(radio);
      } else {
        this.favoriteRadios = this.favoriteRadios.filter(item => item.name !== radio.name);
      }
    },

    FilterMode(filter) {
      this.showFilter = filter;
      console.log(filter);
    },

    FilterByTag() {
      this.tagfilterRadios = this.radios.filter(radio => radio.tags.includes(this.selectedTags));
      this.FilterMode('tag');
    },

    ManageTagsFilter() {
      if (this.selectedTags.length > 5) {
        this.selectedTags = this.selectedTags.slice(0, 5);
      }
      if (this.selectedTags.length == 0) {
        this.tagfilterRadios = [];
        this.FilterMode('all');
      }
      else {
        this.FilterByTag();
      }
    },

    removeDuplicateRadios(radiosarr) {
      const uniqueRadios = radiosarr.filter((radiosarr, index, self) =>
        index === self.map(item => item.name).indexOf(radiosarr.name)
      );
      return uniqueRadios;
    },

  },

  created() {
    this.getRadios();
  },

  computed: {
    filteredRadios() {
      if (this.showFilter === 'all') {
        return this.removeDuplicateRadios(this.radios);
      } else if (this.showFilter === 'favorite') {
        return this.removeDuplicateRadios(this.favoriteRadios);
      } else if (this.showFilter === 'tag') {
        return this.removeDuplicateRadios(this.tagfilterRadios);
      } else {
        return [];
      }
    },

    uniqueTags() {
      const allTags = this.radios.flatMap(radio => radio.tags.split(','));
      return [...new Set(allTags)].sort();
    },
  },

  watch: {
    selectedTags: {
      handler() {
        this.ManageTagsFilter();
      },
      deep: true,
    },
  },
}
</script>
