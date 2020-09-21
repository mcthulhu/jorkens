const { app, BrowserWindow, dialog, globalShortcut, remote, ipcRenderer } = require('electron');
const mainProcess = remote.require('./main.js');
document.getElementById('passage').focus();
document.getElementById("cancel-btn").addEventListener("click", (e) => {
                    window.close();
                });
document.getElementById("ok-btn").addEventListener("click", (e) => {
	var passage =document.getElementById('passage').value;
	var notes=document.getElementById('notes').value;
	mainProcess.addToPassages(passage, notes);
    window.close();
});
