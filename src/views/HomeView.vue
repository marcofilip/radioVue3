<template>
  <v-app>
    <v-container fluid style="padding-left: 100px; padding-right:100px">

      <!-- Titolo -->
      <v-row class="justify-center" style="margin-top: 0">
        <v-card>
          <v-card-title class="text-center big-title">
            Radio Player Italia
            <img src="../../public/img/italy.png" alt="Italian Flag" class="flag"
              style="width:30px; border: 2px solid white; border-radius: 100%">
          </v-card-title>
        </v-card>
      </v-row>

      <!-- Filtri -->
      <v-row align="center" justify="center" class="filterrow">
        <v-btn variant="tonal" class="filter custom-disabled gray-icon" icon="mdi-filter" disabled></v-btn>
        <v-btn-toggle v-model="toggle" divided class="margin" style="padding-left: 20px">
          <v-btn variant="tonal" class="filter" icon="mdi-radio" @click="FilterMode('all')"></v-btn>
          <v-btn variant="tonal" class="filter" icon="mdi-heart" @click="FilterMode('favorite')"></v-btn>
        </v-btn-toggle>

        <v-switch v-model="italyradios" color="green" label="Globale / Italia" hide-details class="margin"
          style="padding-right: 20px" @change="handleItalyRadios"></v-switch>

        <v-text-field clearable v-model="searchTerm" label="Filtra per nome" single-line hide-details
          style="width:200px"></v-text-field>

        <v-combobox clearable v-model="selectedTags" :items="uniqueTags" label="Filtra per tag" multiple
          @change="ManageTagsFilter" class="margin" style="width:200px; padding-left:15px; padding-top: 23px;"
          placeholder="Scrivi un tag..."></v-combobox>

        <v-combobox clearable v-model="selectedStates" :items="uniqueStates" label="Filtra per stato" multiple
          @change="ManageStateFilter" class="margin" style="width:200px; padding-top: 23px;"
          placeholder="Scrivi uno stato..."></v-combobox>

      </v-row>

      <!-- Radio -->
      <v-row>

        <v-col v-for="item in filteredRadios" :key="item.name" cols="12" sm="6" md="4" lg="3" xl="2">
          <v-card class="card d-flex flex-column">

            <v-card-title>
              <a :href="item.homepage" target="_blank" class="radiotitle">{{ item.name }}</a>
            </v-card-title>

            <v-card-text style="font-size: 10px; margin:0;padding:0">
              {{ item.tags.split(',').slice(0, 5).join(',') }}
            </v-card-text>

            <v-card-item class="flex-grow-1">
              <img :src="item.favicon" v-if="item.favicon" class="favicon">
              <span v-else>
                <img :src="require('../../public/img/defaultradioimage.png')" class="favicon">
              </span>
            </v-card-item>

            <v-card-item class="mt-auto">
              <div style="display: flex; justify-content: space-between; align-items: center;">

                <div id="buttonplay" style="flex-grow: 1;">
                  <v-btn block :color="activeRadio === item.name ? 'red' : 'blue'" variant="tonal"
                    @click="activeRadio === item.name ? StopAudio() : PlayAudio(item)">{{ activeRadio === item.name ?
                      'FERMA' : 'SUONA' }}</v-btn>
                </div>

                <div>
                  <img v-if="loadingRadio == item.name" src="../../public/img/loading.gif" alt="Loading..." class="gif">
                </div>
                <div>
                  <img v-if="activeRadio == item.name && loadingRadio == null" src="../../public/img/playing.gif"
                    alt="Playing radio" class="gif">
                </div>

                <v-snackbar v-model="snackbarVisible" color="black" :timeout="5000" multi-line
                  @change="snackbarVisible = false">
                  La radio selezionata ci sta mettendo troppo a caricare. Aspetta o prova con un altra.
                </v-snackbar>

                <div id="favoriteButton" style="flex-grow: 1;">
                  <v-btn v-if="activeRadio != item.name" block :color="isFavorite(item) ? 'red' : 'gray'"
                    @click="addFavorite(item)">
                    <v-icon>mdi-heart</v-icon>
                  </v-btn>
                </div>

                <div id="player" style="flex-grow: 1;">
                </div>

              </div>
            </v-card-item>

          </v-card>
        </v-col>

      </v-row>

    </v-container>
  </v-app>
</template>

<style scoped>
.card {
  height: 350px;
  margin-right: 10px;
}

.margin {
  margin-left: 20px;
  margin-right: 20px;
}

.favicon {
  width: 150px;
  border: 2px solid white;
  border-radius: 40px;
  margin: 0;
}

.v-snackbar {
  font-family: 'Lexend';
}

.v-btn {
  margin: 10px;
}

.filter {
  padding: 0;
  margin: 0;
}

.filterrow {
  border: 5px solid rgb(36, 36, 36);
  border-radius: 30px;
  padding-left: 20px;
  padding-right: 20px;
  border-left: 2px;
  border-right: 2px;
  margin-top: 25px !important;
}

.radiotitle {
  font-family: 'Share Tech Mono';
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

.gif {
  width: 150px;
  height: 50px;
  margin: 0;
}
</style>

<script>
const Hls = require('hls.js');

export default {

  name: 'HomeView',
  data() {
    return {
      radios: [],

      favoriteRadios: [],
      tagfilterRadios: [],
      statefilterRadios: [],

      selectedTags: [],
      selectedStates: [],

      isPlaying: false,
      snackbarVisible: false,
      italyradios: false,

      loadingRadio: null,
      activeRadio: null,

      showFilter: "all",
      searchTerm: '',
    }
  },

  methods: {

    getRadios() {

      if (localStorage.getItem('radios')) {
        this.radios = JSON.parse(localStorage.getItem('radios'));
        console.log(this.radios);
        return;
      }
      var url;
      if (this.italyradios)
        url = 'https://nl1.api.radio-browser.info/json/stations/search?limit=250&countrycode=IT&hidebroken=true&'
          + 'has_geo_info=true&order=clickcount&reverse=true';
      else
        url = 'https://nl1.api.radio-browser.info/json/stations/search?limit=250&hidebroken=true&'
          + 'has_geo_info=true&order=clickcount&reverse=true'

      fetch(url)
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

      this.loadingRadio = item.name;
      console.log(this.loadingRadio);
      const hls = new Hls();
      const url = item.url;
      const audioFormat = this.getAudioFormat(url);

      setTimeout(() => {
        if (this.loadingRadio === item.name) {
          this.snackbarVisible = true;
          console.log(this.snackbarVisible);
        }
      }, 5000);

      if (audioFormat.startsWith('it:8000')) {
        alert("Il formato 'it:8000' non è supportato");
        this.loadingRadio = null;
        return;
      }

      if (audioFormat === 'm3u8' && Hls.isSupported()) {
        this.createHlsPlayer(url, hls);
      } else {
        this.createAudioPlayer(url);
      }

      this.isPlaying = true;
      this.activeRadio = item.name;
    },

    createHlsPlayer(url, hls) {
      let audio = document.getElementById('audioPlayer');
      if (!audio) {
        const player = document.getElementById("player");
        player.innerHTML = `<audio id="audioPlayer" controls style="display:none"></audio>`;
        audio = document.getElementById('audioPlayer');
      }
      hls.loadSource(url);
      hls.attachMedia(audio);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        audio.oncanplay = () => {
          audio.play();
          this.loadingRadio = null;
          console.log(this.loadingRadio);
        };
      });
    },

    createAudioPlayer(url) {
      const player = document.getElementById("player");
      player.innerHTML = `<audio id="audioPlayer" controls autoplay style="display:none">
                        <source src="${url}" type="audio/mpeg">
                      </audio>`;
      const audio = document.getElementById('audioPlayer');
      audio.oncanplaythrough = () => {
        this.loadingRadio = null;
        console.log(this.loadingRadio);
      };
    },

    StopAudio() {
      var audio = document.getElementById('audioPlayer');
      if (audio) { audio.pause(); }

      this.loadingRadio = null;
      this.isPlaying = false;
      this.activeRadio = null;
    },

    handleItalyRadios() {
      localStorage.setItem('italyradios', this.italyradios);
      localStorage.removeItem('radios');
      location.reload();
    },

    checkitalyradios() {
      this.italyradios = localStorage.getItem('italyradios') === 'true' ? true : false;
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

    FilterByState() {
      this.statefilterRadios = this.radios.filter(radio => radio.state.includes(this.selectedStates));
      this.FilterMode('state');
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

    ManageStateFilter() {
      console.log("test!");
      if (this.selectedStates.length > 5) {
        this.selectedStates = this.selectedStates.slice(0, 5);
      }
      if (this.selectedStates.length == 0) {
        this.statefilterRadios = [];
        this.FilterMode('all');
      }
      else {
        this.FilterByState();
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
    this.checkitalyradios();
    console.log(this.italyradios);
    this.getRadios();
  },

  computed: {
    filteredRadios() {
      let radios = [];
      if (this.showFilter === 'all') {
        radios = this.removeDuplicateRadios(this.radios);
      } else if (this.showFilter === 'favorite') {
        radios = this.removeDuplicateRadios(this.favoriteRadios);
      } else if (this.showFilter === 'tag') {
        radios = this.removeDuplicateRadios(this.tagfilterRadios);
      } else if (this.showFilter === 'state') {
        radios = this.removeDuplicateRadios(this.statefilterRadios);
      }
      if (this.searchTerm) {
        radios = radios.filter(radio => radio.name.toLowerCase().includes(this.searchTerm.toLowerCase()));
      }
      return radios;
    },

    uniqueTags() {
      const allTags = this.radios.flatMap(radio => radio.tags.split(','));
      return [...new Set(allTags)].sort();
    },

    uniqueStates() {
      const allTags = this.radios.flatMap(radio => radio.state);
      return [...new Set(allTags)].sort();
    }
  },

  watch: {
    selectedTags: {
      handler() {
        this.ManageTagsFilter();
      },
      deep: true,
    },
    selectedStates: {
      handler() {
        this.ManageStateFilter();
      },
      deep: true,
    },
  },
}
</script>
