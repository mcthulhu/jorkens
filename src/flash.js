const { app, BrowserWindow, dialog, globalShortcut, ipcRenderer } = require('electron');
document.getElementById('term').focus();
document.getElementById('context').value = ipcRenderer.sendSync('get-context');
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
	var language= ipcRenderer.sendSync('get-language');
	ipcRenderer.send('add-flashcard', term, def, context, language, tags);
    window.close();
});
