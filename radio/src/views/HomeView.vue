<template>

  <v-container fluid style="padding-left: 100px; padding-right: 100px">

    <!-- Titolo -->
    <v-row class="margin">

      <v-toolbar>
        <v-toolbar-title>
          <b>Radio Player Italia</b>
        </v-toolbar-title>
      </v-toolbar>

    </v-row>

    <!-- Filtro -->
    <v-row justify="center" class="margin">

      <v-item-group>

        <v-btn-toggle v-model="toggle" divided>

          <v-btn variant="tonal" class="filter custom-disabled" icon="mdi-filter" disabled></v-btn>
          <v-btn variant="tonal" class="filter" icon="mdi-radio" @click="FilterMode('all')"></v-btn>
          <v-btn variant="tonal" class="filter" icon="mdi-heart" @click="FilterMode('favorite')"></v-btn>

        </v-btn-toggle>

      </v-item-group>

    </v-row>

    <!-- Radio -->
    <v-row>
      <v-col v-for="item in filteredRadios" :key="item.name" cols="12" sm="6" md="4" lg="2" xl="1">
        <v-card class="card d-flex flex-column">

          <v-card-title>
            <b>{{ item.name }}</b>
          </v-card-title>

          <v-card-text style="font-size: 10px;">
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

              <div id="buttonplay">

                <v-btn :color="activeRadio === item.name ? 'red' : 'blue'" variant="tonal"
                  @click="activeRadio === item.name ? StopAudio() : PlayAudio(item)">{{ activeRadio === item.name ?
                    'FERMA' : 'SUONA' }}</v-btn>

              </div>

              <div id="favoriteButton">

                <v-btn :color="isFavorite(item) ? 'red' : 'gray'" @click="addFavorite(item)">
                  <v-icon>mdi-heart</v-icon>
                </v-btn>

              </div>

              <div id="player">
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
  opacity: 1 !important;
  color: inherit !important;
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
      showFilter: "all",
    }
  },

  methods: {

    getRadios() {

      if (localStorage.getItem('radios')) {
        this.radios = JSON.parse(localStorage.getItem('radios'));
        console.log(this.radios);
        return;
      }

      fetch('https://nl1.api.radio-browser.info/json/stations/search?limit=20' +
        '&countrycode=IT')
        .then(response => response.json())
        .then(data => {
          this.radios = data;
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
  },

  created() {
    this.getRadios();
  },

  computed: {
    filteredRadios() {
      if (this.showFilter === 'all') {
        return this.radios;
      } else if (this.showFilter === 'favorite') {
        return this.favoriteRadios;
      } else {
        return [];
      }
    },
  },

}
</script>
