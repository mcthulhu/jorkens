const { app, BrowserWindow, dialog, globalShortcut, remote, ipcRenderer } = require('electron');
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
	var tags=document.getElementById('tags').value;
	if(!tags) {
		var tags="-";
	}
	term=term.trim();
	def=def.trim();
	tags=tags.trim();
	var language= require('electron').remote.getGlobal('sharedObject').language;
	mainProcess.addFlashcard(term, def, context, language, tags);
    window.close();
});
