<template>
    <v-app>
        <v-container>
            <div>Muovi il globo e zomma per visualizzare le radio in 3D:</div>
            <div class="flex-container">
                <div class="radios-space">
                    <v-row v-for="item in radios_with_location" :key="item.name">
                        <v-col>
                            <v-card class="d-flex">

                                <v-card-item class="title-container">
                                    <div>
                                        <a :href="item.homepage" target="_blank" class="title">{{ item.name }}</a>
                                        <p class="stato">{{ item.state ? item.state : 'Non Specificato' }}</p>
                                    </div>
                                </v-card-item>

                                <v-card-item class="favicon-container">
                                    <div>
                                        <img :src="item.favicon" v-if="item.favicon" class="favicon">
                                        <span v-else>
                                            <img :src="require('../../public/img/defaultradioimage.png')"
                                                class="favicon">
                                        </span>
                                    </div>
                                </v-card-item>

                                <v-card-item class="gif-container">
                                    <div>
                                        <img v-if="loadingRadio == item.name" src="../../public/img/loading.gif"
                                            alt="Loading..." class="gif">
                                    </div>
                                    <div>
                                        <img v-if="activeRadio == item.name && loadingRadio == null"
                                            src="../../public/img/playing.gif" alt="Playing radio" class="gif">
                                    </div>
                                </v-card-item>

                                <v-snackbar v-model="snackbarVisible" color="black" :timeout="5000" multi-line
                                    @change="snackbarVisible = false">
                                    La radio selezionata ci sta mettendo troppo a caricare. Aspetta o prova con un
                                    altra.
                                </v-snackbar>

                                <v-card-item class="button-container">
                                    <div>
                                        <v-btn block :color="activeRadio === item.name ? 'red' : 'yellow'"
                                            variant="tonal"
                                            @click="activeRadio === item.name ? StopAudio() : PlayAudio(item)"
                                            class="suona-button">{{
                                                activeRadio === item.name ?
                                                    'FERMA' : 'CERCA' }}</v-btn>
                                        <div id="player" style="flex-grow: 1;">
                                        </div>
                                    </div>
                                </v-card-item>

                            </v-card>
                        </v-col>
                    </v-row>
                </div>
                <div class="globe_container" ref="container">
                </div>

                <v-snackbar v-model="loading3d" color="black" multi-line>
                    Radio 3D in caricamento...
                </v-snackbar>
            </div>
        </v-container>
    </v-app>
</template>

<style scoped>
.flex-container {
    display: flex;
    height: 75vh;
}

.v-card-item.gif-container {
    flex: 0.5; 
    display: flex;
    justify-content: center;
    align-items: center;
    padding-left: 0;
    padding-right: 0;
}

.button-container {
    flex: 1.5; 
    display: flex;
    justify-content: center;
    align-items: center;
    padding-left: 0;
    padding-right: 0;
}

.radios-space {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: 20px;
}

.globe_container {
    flex: 1.5;
}

.stato {
    font-size: 12px;
}

.gif {
    width: 50px;
    height: 50px;
    margin: 0;
}

.favicon {
    width: 50px;
    border: 2px solid white;
    border-radius: 40px;
}

.v-btn {
    margin: 10px;
}

.title-container {
    flex: 0 0 40%;
    white-space: normal;
    word-wrap: break-word;
}

.favicon-container {
    flex: 0 0 20%;
}


.suona-button {
    width: 100%;
}
</style>

<script>
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import earthTexture from '../../public/img/globo.jpg';
import starTexture from '../../public/img/stelle.jpg';
import defaultRadioImage from '../../public/img/defaultradioimage.png';
const Hls = require('hls.js');

export default {
    name: 'ThreeJsScene',
    data() {
        return {
            radios: [],
            radios_with_location: [],
            markers: [],
            camera: null,
            renderer: null,
            controls: null,
            selectedMarker: null,
            activeRadio: null,
            isPlaying: false,
            loading3d: false,
            loadingRadio: null,
            snackbarVisible: false,
        };
    },

    mounted() {
        this.getRadios();
        this.init();
        this.animate();

        this.radios.forEach(station => {
            if (station.geo_lat && station.geo_long) {
                this.radios_with_location.push(station);
                var station_texture;
                if (station.favicon)
                    station_texture = station.favicon;
                else
                    station_texture = defaultRadioImage;
                this.addMarker(station, 0.02, station_texture);
            }
        });
        this.radios_with_location = this.removeDuplicateRadios(this.radios_with_location);
        console.log("Radios: ", this.radios_with_location);
        console.log("Markers: ", this.markers);

        window.addEventListener('resize', this.handleWindowResize);
    },

    beforeUnmount() {
        window.removeEventListener('resize', this.handleWindowResize);
    },

    methods: {

        getRadios() {
            const radios = localStorage.getItem("radios");
            this.radios = radios ? JSON.parse(radios) : [];
        },

        getAudioFormat(url) {
            var extension = url.split('.').pop();
            return extension;
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

        removeDuplicateRadios(radiosarr) {
            const uniqueRadios = radiosarr.filter((radiosarr, index, self) =>
                index === self.map(item => item.name).indexOf(radiosarr.name)
            );
            return uniqueRadios;
        },

        init() {
            this.loading3d = true;
            console.log(this.loading3d);
            const container = this.$refs.container;
            const width = container.clientWidth - 0;
            const height = container.clientHeight - 0;
            const aspectRatio = width / height;

            this.camera = new THREE.PerspectiveCamera(20, aspectRatio, 0.1, 1000);

            this.renderer = new THREE.WebGLRenderer();
            this.renderer.setSize(width, height);
            container.appendChild(this.renderer.domElement);
            this.camera.updateProjectionMatrix();

            this.controls = new OrbitControls(this.camera, this.renderer.domElement);
            this.controls.rotateSpeed = 0.1;
            this.controls.zoomSpeed = 1;
            this.controls.panSpeed = 2;

            this.controls.enableDamping = true;
            this.controls.minDistance = 1.2;
            this.controls.maxDistance = 7;

            const scene = new THREE.Scene();

            const stargeometry = new THREE.SphereGeometry(1 + 100, 8, 8);
            const startexture = new THREE.TextureLoader();
            const starmaterial = new THREE.MeshBasicMaterial({
                side: THREE.DoubleSide,
                color: 0xaaaaaa,
                opacity: 0.5,
                transparent: true
            });
            const stars = new THREE.Mesh(stargeometry, starmaterial);
            startexture.load(starTexture, (texture) => {
                starmaterial.map = texture;
                this.scene.add(stars);
            });

            const geometry = new THREE.SphereGeometry(1, 128, 128);
            const texture = new THREE.TextureLoader();
            const material = new THREE.MeshBasicMaterial();
            const earth = new THREE.Mesh(geometry, material);
            texture.load(earthTexture, (texture) => {
                material.map = texture;
                this.scene.add(earth);
                this.loading3d = false;
                console.log(this.loading3d);
            });

            this.scene = scene;
        },

        addMarker(radio, markerSize, favicon) {
            const longitude = radio.geo_long;
            const latitude = radio.geo_lat;
            if (longitude !== null && latitude !== null) {
                const phi = (90 - latitude) * (Math.PI / 180);
                const theta = (longitude + 180) * (Math.PI / 180);
                var x = -(1 + 0.005) * Math.sin(phi) * Math.cos(theta);
                var y = (1 + 0.005) * Math.cos(phi);
                var z = (1 + 0.005) * Math.sin(phi) * Math.sin(theta);
                var xcam = -(1 + 0.5) * Math.sin(phi) * Math.cos(theta);
                var ycam = (1 + 0.5) * Math.cos(phi);
                var zcam = (1 + 0.5) * Math.sin(phi) * Math.sin(theta);
                const loader = new THREE.TextureLoader();
                loader.load(
                    favicon,
                    (texture) => {
                        const material = new THREE.SpriteMaterial({ map: texture });
                        const marker = new THREE.Sprite(material);
                        marker.scale.set(markerSize, markerSize, 1);
                        marker.position.set(x, y, z);
                        marker.lookAt(new THREE.Vector3(0, 0, 0));
                        marker.name = radio.name;
                        this.markers.push(marker);
                        this.scene.add(marker);
                        this.camera.position.set(xcam, ycam, zcam);
                        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
                    },
                    undefined,
                    (error) => {
                        console.error(error);
                        const defaultLoader = new THREE.TextureLoader();
                        const defaultImageUrl = new URL('../../public/img/defaultradioimage.png', import.meta.url).toString();
                        defaultLoader.load(
                            defaultImageUrl,
                            (defaulttexture) => {
                                const material = new THREE.SpriteMaterial({ map: defaulttexture });
                                const marker = new THREE.Sprite(material);
                                marker.scale.set(markerSize, markerSize, 1);
                                marker.position.set(x, y, z);
                                marker.lookAt(new THREE.Vector3(0, 0, 0));
                                marker.name = radio.name;
                                this.markers.push(marker);
                                this.scene.add(marker);
                                this.camera.position.set(xcam, ycam, zcam);
                                this.camera.lookAt(new THREE.Vector3(0, 0, 0));
                            },
                        );
                    }
                );
            }
        },

        animate() {
            requestAnimationFrame(this.animate);

            if (this.controls) {
                this.controls.update();
            }

            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
            }
        },

        handleWindowResize() {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        },

        moveCameraToMarker(name) {
            const marker = this.markers.find(marker => marker.name === name);
            if (marker) {
                if (this.selectedMarker) {
                    this.selectedMarker.scale.set(0.01, 0.01, 1);
                }
                const scaleFactor = 2;
                this.camera.position.set(marker.position.x * scaleFactor, marker.position.y * scaleFactor, marker.position.z * scaleFactor);
                this.camera.lookAt(new THREE.Vector3(0, 0, 0));
                marker.scale.set(0.06, 0.06, 0.06);
                this.selectedMarker = marker;
            }
        },
    }
};
</script>