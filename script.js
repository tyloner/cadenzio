document.addEventListener("DOMContentLoaded", function () {
    // Initialize Swiper (Intro Carousel)
    new Swiper('.swiper-container', {
        loop: true,
        pagination: { el: '.swiper-pagination' }
    });

    // Track sensitivity slider
    document.getElementById("pingRate").addEventListener("input", function (event) {
        document.getElementById("pingValue").innerText = `${event.target.value} ms`;
    });

    // Sign-In Button Placeholder
    document.getElementById("signInBtn").addEventListener("click", function () {
        alert("SSO feature coming soon!");
    });

    // Leaflet Map Initialization
    var map = L.map('map').setView([51.505, -0.09], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Track Movement & Music Generation
    let synth;
    let instrumentType = "synth";
    let recording = false;
    let recordedNotes = [];
    let pingRate = 1000;

    function setupInstrument() {
        switch (instrumentType) {
            case "piano":
                synth = new Tone.Sampler({
                    urls: { C4: "sounds/C4_piano.mp3" }
                }).toDestination();
                break;
            case "strings":
                synth = new Tone.Sampler({
                    urls: { C4: "sounds/C4_strings.mp3" }
                }).toDestination();
                break;
            default:
                synth = new Tone.Synth().toDestination();
        }
    }
    setupInstrument();

    var userPath = [];
    var polyline = L.polyline([], { color: 'blue' }).addTo(map);
    var userMarker = null;
    var lastDirection = null;

    function getDirection(lat1, lon1, lat2, lon2) {
        let y = Math.sin(lon2 - lon1) * Math.cos(lat2);
        let x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
        return Math.atan2(y, x) * (180 / Math.PI);
    }

    function playNoteFromDirection(direction) {
        if (!synth) return;
        let index = Math.floor((direction + 180) / 60) % 7;
        let scale = ["C4", "D4", "E4", "F4", "G4", "A4", "B4"];
        let note = scale[index];

        console.log(`Playing note: ${note}`);
        synth.triggerAttackRelease(note, "8n");
        if (recording) recordedNotes.push({ note, time: Tone.now() });
    }

    function updateLocation(position) {
        var lat = position.coords.latitude;
        var lon = position.coords.longitude;
        
        if (userPath.length > 0) {
            let prevLat = userPath[userPath.length - 1][0];
            let prevLon = userPath[userPath.length - 1][1];
            let direction = getDirection(prevLat, prevLon, lat, lon);
            playNoteFromDirection(direction);
        }
        
        userPath.push([lat, lon]);
        polyline.setLatLngs(userPath);

        if (!userMarker) {
            userMarker = L.marker([lat, lon]).addTo(map).bindPopup("You are here").openPopup();
        } else {
            userMarker.setLatLng([lat, lon]);
        }
        map.setView([lat, lon], 16);
    }

    function startGPSUpdates() {
        if (navigator.geolocation) {
            navigator.geolocation.watchPosition(updateLocation, function(error) {
                console.log("Error getting location:", error);
                alert("Error getting location. Make sure GPS is enabled and try again.");
            }, {
                enableHighAccuracy: true,
                timeout: pingRate,
                maximumAge: 0
            });
        } else {
            alert("Geolocation is not supported by your browser.");
        }
    }
    startGPSUpdates();

    // Track Recording Controls
    document.getElementById("startTracking").addEventListener("click", function () {
        recording = true;
        recordedNotes = [];
        document.getElementById("stopTracking").disabled = false;
        document.getElementById("startTracking").disabled = true;
    });

    document.getElementById("stopTracking").addEventListener("click", function () {
        recording = false;
        document.getElementById("stopTracking").disabled = true;
        document.getElementById("startTracking").disabled = false;
    });

    document.getElementById("saveTrack").addEventListener("click", function () {
        let trackData = { date: new Date().toLocaleString(), path: userPath };
        let savedTracks = JSON.parse(localStorage.getItem("savedTracks")) || [];
        savedTracks.push(trackData);
        localStorage.setItem("savedTracks", JSON.stringify(savedTracks));
        loadSavedTracks();
    });

    function loadSavedTracks() {
        let savedList = document.getElementById("savedTracks");
        savedList.innerHTML = "";
        let savedTracks = JSON.parse(localStorage.getItem("savedTracks")) || [];
        savedTracks.forEach((track, index) => {
            let li = document.createElement("li");
            li.innerHTML = `Track ${index + 1} - ${track.date}`;
            savedList.appendChild(li);
        });
    }
    loadSavedTracks();

    document.getElementById("clearTracks").addEventListener("click", function () {
        localStorage.removeItem("savedTracks");
        loadSavedTracks();
    });
});
