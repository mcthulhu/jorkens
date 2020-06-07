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
	var lang= 'it';
	alert(term + " = " + def);
	mainProcess.addToDictionary(term, def, lang);
                    window.close();
                });
