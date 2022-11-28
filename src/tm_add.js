const { app, BrowserWindow, dialog, globalShortcut, ipcRenderer } = require('electron');
document.getElementById('source').focus();
document.getElementById("cancel-btn").addEventListener("click", (e) => {
                    window.close();
                });
document.getElementById("ok-btn").addEventListener("click", (e) => {
	var source=document.getElementById('source').value;
	var target=document.getElementById('target').value;
	var srclang= ipcRenderer.sendSync('get-language');
	ipcRenderer.send('add-pair-to-TM', source, target, srclang);
    window.close();
});
