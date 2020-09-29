const { app, BrowserWindow, dialog, globalShortcut, remote, ipcRenderer } = require('electron');
// { process } = require('electron').remote;
const mainProcess = remote.require('./main.js');
document.getElementById('term').focus();
document.getElementById('context').value = require('electron').remote.getGlobal('sharedObject').contextSentence;
document.getElementById("cancel-btn").addEventListener("click", (e) => {
                    window.close();
                });
document.getElementById("ok-btn").addEventListener("click", (e) => {
	var term=document.getElementById('term').value;
	var def=document.getElementById('def').value;
	var context=document.getElementById('context').value || '';
	var addflashcard = document.getElementById('addflashcard').checked;
	
	var lang= require('electron').remote.getGlobal('sharedObject').language;
	mainProcess.addToDictionary(term, def, context, lang, addflashcard);
                    window.close();
                });
