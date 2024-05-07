<template>
    <div ref="container"></div>
</template>

<script>
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import earthTexture from '../../img/globo.jpg';
import starTexture from '../../img/stelle.jpg';

export default {
    name: 'ThreeJsScene',
    data() {
        return {
            camera: null,
            renderer: null,
            controls: null,
            earthRadius: 1,
            radios_with_location: [],
            markers: [],
        };
    },

    mounted() {
        this.init();
        this.animate();

        const data = localStorage.getItem('radios');
        if (data) {
            const radioStations = JSON.parse(data);
            radioStations.forEach(station => {
                if (station.geo_lat && station.geo_long) {
                    this.radios_with_location.push(station);
                    const marker = this.addMarker(station, 0.02);
                    this.markers.push(marker);
                }
            });
        } else {
            console.error('No radio station data found in localStorage');
        }

        console.log("Radios: ", this.radios_with_location);
        console.log("Markers: ", this.markers);

        window.addEventListener('resize', this.handleWindowResize);
    },

    beforeUnmount() {
        window.removeEventListener('resize', this.handleWindowResize);
    },

    methods: {

        init() {
            this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            this.camera.position.z = 5;

            this.renderer = new THREE.WebGLRenderer();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.$refs.container.appendChild(this.renderer.domElement);

            this.controls = new OrbitControls(this.camera, this.renderer.domElement);
            this.controls.rotateSpeed = 0.5; // Adjust this value to change the rotation speed
            this.controls.zoomSpeed = 1; // Adjust this value to change the zoom speed
            this.controls.panSpeed = 0.5; // Adjust this value to change the panning speed

            this.controls.enableDamping = true;
            this.controls.minDistance = 1.2; // Minimum zoom level
            this.controls.maxDistance = 3; // Maximum zoom level

            const scene = new THREE.Scene();

            // Create a starry background
            const stargeometry = new THREE.SphereGeometry(this.earthRadius + 100, 8, 8); // Increase segments for smoother surface
            const startexture = new THREE.TextureLoader();
            startexture.encoding = THREE.LinearEncoding;
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
            const geometry = new THREE.SphereGeometry(this.earthRadius, 128, 128); // Increase segments for smoother surface
            const texture = new THREE.TextureLoader().load(earthTexture);
            texture.encoding = THREE.LinearEncoding;
            const material = new THREE.MeshBasicMaterial({ map: texture });
            const earth = new THREE.Mesh(geometry, material);
            scene.add(earth);

            this.scene = scene;
        },

        addMarker(radio, markerSize = 0.01) {
            const longitude = radio.geo_long;
            const latitude = radio.geo_lat;

            if (longitude !== null && latitude !== null) {

                const phi = (90 - latitude) * (Math.PI / 180);
                const theta = (longitude + 180) * (Math.PI / 180);
                const x = -this.earthRadius * Math.sin(phi) * Math.cos(theta);
                const y = this.earthRadius * Math.cos(phi);
                const z = this.earthRadius * Math.sin(phi) * Math.sin(theta);

                // Use ConeGeometry to make the marker resemble a pin
                const geometry = new THREE.ConeGeometry(markerSize, markerSize * 2, 32);
                const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
                const marker = new THREE.Mesh(geometry, material);
                marker.position.set(x, y, z);

                // Rotate the marker so that the tip points towards the earth
                marker.lookAt(new THREE.Vector3(0, 0, 0));

                this.scene.add(marker);

                // Move the camera to the marker's position
                this.camera.position.set(x, y, z); // Add a small offset in the z direction so the camera isn't inside the marker
                this.camera.lookAt(new THREE.Vector3(0, 0, 0)); // Make the camera look at the center of the scene
                return marker;

            } else {
                console.error('Longitude or latitude is null');
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
    }
};
</script>