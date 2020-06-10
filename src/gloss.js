const { app, BrowserWindow, dialog, globalShortcut, remote, ipcRenderer } = require('electron');
// { process } = require('electron').remote;
const mainProcess = remote.require('./main.js');
document.getElementById('term').focus();
document.getElementById("cancel-btn").addEventListener("click", (e) => {
                    window.close();
                });
document.getElementById("ok-btn").addEventListener("click", (e) => {
	var term=document.getElementById('term').value;
	var def=document.getElementById('def').value;
	var lang= require('electron').remote.getGlobal('sharedObject').language;
	mainProcess.addToDictionary(term, def, lang);
                    window.close();
                });
