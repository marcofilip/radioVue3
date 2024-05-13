<template>
  <nav>
    <router-link to="/">Home</router-link> |
    <router-link to="/radio3d">Radio 3D</router-link> |
    <router-link to="/infoview">Info</router-link>
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
