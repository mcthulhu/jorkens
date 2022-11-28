const { app, BrowserWindow, dialog, globalShortcut, ipcRenderer } = require('electron');
document.getElementById('term').focus();
document.getElementById('context').value = ipcRenderer.sendSync('get-context');
document.getElementById("cancel-btn").addEventListener("click", (e) => {
    window.close();
});
document.getElementById("clear-btn").addEventListener("click", (e) => {
     document.getElementById('context').value = '';
});
document.getElementById("ok-btn").addEventListener("click", (e) => {
	var term=document.getElementById('term').value;
	var def=document.getElementById('def').value;
	var context=document.getElementById('context').value || '';
	var addflashcard = document.getElementById('addflashcard').checked;
	var lang= ipcRenderer.sendSync('get-language');
	ipcRenderer.send('add-to-dictionary', term, def, context, lang, addflashcard);
    window.close();
 });
