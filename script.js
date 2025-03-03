// Wait for user interaction before starting audio
let synth;
let instrumentType = "synth";
let recording = false;
let recordedNotes = [];
let pingRate = 1000; // Default ping rate in milliseconds

document.addEventListener("click", () => {
    if (!synth) {
        Tone.start();
        synth = new Tone.Synth().toDestination();
        console.log("AudioContext started!");
    }
});

// Initialize the map
document.addEventListener("DOMContentLoaded", function() {
    var map = L.map('map').setView([51.505, -0.09], 13);

    // Load OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Define musical scales
    const scales = {
        "C_Major": ["C4", "D4", "E4", "F4", "G4", "A4", "B4"],
        "D_Minor": ["D4", "E4", "F4", "G4", "A4", "Bb4", "C5"],
        "Blues": ["C4", "Eb4", "F4", "Gb4", "G4", "Bb4"]
    };

    let selectedScale = scales["C_Major"];

    // Function to update scale when user selects a new one
    document.getElementById("scaleSelect").addEventListener("change", function(event) {
        selectedScale = scales[event.target.value];
        console.log(`Scale changed to: ${event.target.value}`);
    });

    // Function to update instrument when user selects a new one
    document.getElementById("instrumentSelect").addEventListener("change", function(event) {
        instrumentType = event.target.value;
        setupInstrument();
        console.log(`Instrument changed to: ${instrumentType}`);
    });

    function setupInstrument() {
        switch (instrumentType) {
            case "piano":
                synth = new Tone.Sampler({
                    urls: { C4: "https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/acoustic_grand_piano-mp3/C4.mp3" }
                }).toDestination();
                break;
            case "strings":
                synth = new Tone.Sampler({
                    urls: { C4: "https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/string_ensemble_1-mp3/C4.mp3" }
                }).toDestination();
                break;
            default:
                synth = new Tone.Synth().toDestination();
        }
    }

    setupInstrument(); // Initialize default instrument

    var userPath = [];
    var userMarker = null;
    var polyline = L.polyline([], { color: 'blue' }).addTo(map);
    var lastDirection = null;

    function getDirection(lat1, lon1, lat2, lon2) {
        let y = Math.sin(lon2 - lon1) * Math.cos(lat2);
        let x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
        return Math.atan2(y, x) * (180 / Math.PI);
    }

    function playNoteFromDirection(direction) {
        if (!synth) return;
        let index = Math.floor((direction + 180) / (360 / selectedScale.length)) % selectedScale.length;
        let note = selectedScale[index];

        console.log(`Playing note: ${note}`);
        synth.triggerAttackRelease(note, "8n");

        if (recording) {
            recordedNotes.push({ note, time: Tone.now() });
        }
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
            userMarker = L.marker([lat, lon]).addTo(map)
                .bindPopup("You are here").openPopup();
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

    document.getElementById("pingRate").addEventListener("input", function(event) {
        pingRate = parseInt(event.target.value);
        document.getElementById("pingValue").innerText = `${pingRate} ms`;
        startGPSUpdates();
        console.log(`Ping rate updated to: ${pingRate} ms`);
    });

    startGPSUpdates();

    document.getElementById("startRecording").addEventListener("click", function() {
        recording = true;
        recordedNotes = [];
        document.getElementById("stopRecording").disabled = false;
        document.getElementById("startRecording").disabled = true;
    });

    document.getElementById("stopRecording").addEventListener("click", function() {
        recording = false;
        document.getElementById("stopRecording").disabled = true;
        document.getElementById("downloadRecording").disabled = false;
        document.getElementById("startRecording").disabled = false;
    });

    document.getElementById("downloadRecording").addEventListener("click", function() {
        const midi = new Uint8Array([0x4D, 0x54, 0x68, 0x64]);
        const blob = new Blob([midi], { type: "audio/midi" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "music.mid";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
});