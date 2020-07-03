const { app, BrowserWindow, dialog, globalShortcut, remote, ipcRenderer } = require('electron');
// { process } = require('electron').remote;
const mainProcess = remote.require('./main.js');
document.getElementById('source').focus();
document.getElementById("cancel-btn").addEventListener("click", (e) => {
                    window.close();
                });
document.getElementById("ok-btn").addEventListener("click", (e) => {
	var source=document.getElementById('source').value;
	var target=document.getElementById('target').value;
	var srclang= require('electron').remote.getGlobal('sharedObject').language;
	mainProcess.addPairToTM(source, target, srclang);
                    window.close();
                });
