<template>
  <v-container>

    <v-toolbar>
      <v-toolbar-title>
        <b>Radio Player</b>
      </v-toolbar-title>
    </v-toolbar>
    <br>
    <v-row>
      <v-col v-for="item in radios" :key="item.name" cols="4">
        <v-card class="card d-flex flex-column">

          <v-card-title>
            <b>{{ item.name }}</b>
          </v-card-title>

          <v-card-text>
            {{ item.tags }}
          </v-card-text>

          <v-card-item class="flex-grow-1">
            <img :src="item.favicon" v-if="item.favicon" class="favicon">
            <span v-else>
              <img :src="require('../../img/defaultradioimage.png')" class="favicon">
            </span>
          </v-card-item>

          <v-card-item class="mt-auto">
            <v-btn variant="tonal" @click="PlayAudio(item.url)">Play!</v-btn>
          </v-card-item>

        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>

.card {
  height: 300px;
  margin-right: 20px;
}

.favicon {
  width: 100px;
  border: 5px solid black;
  border-radius: 40px;
  margin: 0;
}

.v-btn {
  margin: 10px;
}

</style>

<script>
export default {

  name: 'HomeView',
  data() {
    return {
      radios: [],
    }
  },

  methods: {

    getRadios() {

      //controllo se le radio sono già presenti in localStorage
      if (localStorage.getItem('radios')) {
        this.radios = JSON.parse(localStorage.getItem('radios'));
        console.log("localStorage");
        console.log(this.radios);
        return;
      }

      //se no faccio il fetch
      fetch('https://nl1.api.radio-browser.info/json/stations/search?limit=100' +
        '&countrycode=IT&hidebroken=true&order=clickcount&reverse=true')
        .then(response => response.json())
        .then(data => {
          this.radios = data;
          this.saveInLocalStorage();
          console.log("fetch");
          console.log(this.radios);
        })
        .catch(error => {
          console.error('ERRORE! Ecco Cosa Non Va :) \n\n', error);
        });
    },

    getAudioFormat(url) {
      var extension = url.split('.').pop();
      console.log(extension);
      return extension;
    },

    saveInLocalStorage() {
      localStorage.setItem('radios', JSON.stringify(this.radios));
    },

    PlayAudio(url) {
      const audioFormat = this.getAudioFormat(url);

      if (audioFormat === 'mp3') {
        // Code to play MP3 files

        alert("Play mp3!");

      } else if (audioFormat === 'm3u8') {
        // Code to play M3U8 files

        alert("Play m3u8!");

      } else {
        // Code to play ? files

        alert("Play " + audioFormat + "!")

      }
    }

  },
  created() {
    this.getRadios();
  },
}
</script>
