const { app, BrowserWindow, dialog, globalShortcut, remote, ipcRenderer } = require('electron');
// { process } = require('electron').remote;
const mainProcess = remote.require('./main.js');
document.getElementById('passage').focus();
document.getElementById("cancel-btn").addEventListener("click", (e) => {
                    window.close();
                });
document.getElementById("ok-btn").addEventListener("click", (e) => {
	var passage =document.getElementById('passage').value;
	var notes=document.getElementById('notes').value;
	var marktype=document.getElementById('marktype').value;
	var color=document.getElementById('color').value;
	var tags=document.getElementById('tags').value;
	mainProcess.addToPassages(passage, notes, marktype, color, tags);
                    window.close();
                });
