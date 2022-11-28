const { app, BrowserWindow, dialog, globalShortcut, ipcRenderer } = require('electron');

ipcRenderer.on('play-audio', (event, fn) => {
	wavesurfer.load(fn);
});

var wavesurfer = WaveSurfer.create({
    container: document.querySelector('#waveform'),
	waveColor: 'violet',
    progressColor: 'purple',
    plugins: [
		WaveSurfer.timeline.create({
			container: "#wave-timeline"
		}),
        WaveSurfer.cursor.create({
            showTime: true,
            opacity: 1,
            customShowTimeStyle: {
                'background-color': '#000',
                color: '#fff',
                padding: '2px',
                'font-size': '10px'
            }
        })
    ]
});

wavesurfer.on('ready', function () {
    wavesurfer.play();
});

// You can also trigger various actions on the player, such as wavesurfer.pause(), wavesurfer.skipForward(), wavesurfer.toggleMute() etc. 

document.getElementById("cancel-btn").addEventListener("click", (e) => {
	wavesurfer.destroy();
    window.close();
});
document.getElementById("backward").addEventListener("click", (e) => {
	wavesurfer.skipBackward(5);
});

document.getElementById("playpause").addEventListener("click", (e) => {
	wavesurfer.playPause();
});
document.getElementById("forward").addEventListener("click", (e) => {
	wavesurfer.skipForward(5);
});
