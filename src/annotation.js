const { app, BrowserWindow, dialog, globalShortcut, ipcRenderer } = require('electron');
document.getElementById('passage').focus();
document.getElementById("cancel-btn").addEventListener("click", (e) => {
                    window.close();
                });
document.getElementById("ok-btn").addEventListener("click", (e) => {
	var passage =document.getElementById('passage').value;
	var notes=document.getElementById('notes').value;
	ipcRenderer.send('add-to-passages', passage, notes);
    window.close();
});
