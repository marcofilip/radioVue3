<template>
  <v-container>
    <v-card>
      <v-card-title v-for="item in radios" :key="item.name">
        {{ item.name }}
      </v-card-title>
      <v-card-text v-for="item in radios" :key="item.tags">
        {{ item.tags }}
      </v-card-text>
      <v-card-item v-for="item in radios" :key="item.favicon">
        {{ item.favicon }}
      </v-card-item>
    </v-card>
  </v-container>
</template>

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
      fetch('https://nl1.api.radio-browser.info/json/stations/search?limit=100&countrycode=IT&hidebroken=true&order=clickcount&reverse=true')
        .then(response => response.json())
        .then(data => {
          this.radios = data;
          console.log(data);
        });
    },

    saveInLocalStorage() {
      localStorage.setItem('radios', JSON.stringify(this.radios));
    },
  },
  created() {
    this.getRadios();
  },
}
</script>
