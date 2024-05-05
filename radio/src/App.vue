<template>
  <nav>
    <router-link to="/">Home</router-link> |
    <router-link to="/about">About</router-link> |
    <router-link to="/contatti">Contatti</router-link>
  </nav>
  <router-view/>
</template>

<style>
#app {
  font-family: Lexend;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #ffffffd8;
}

nav {
  padding: 30px;
}

nav a {
  font-weight: bold;
  color: #ffffffd8;
}

nav a.router-link-exact-active {
  color: #42b983;
}
</style>
