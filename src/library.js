const { app, dialog, globalShortcut, remote, ipcRenderer } = require('electron');
const { BrowserWindow } = require('electron').remote;
const mainProcess = remote.require('./main.js');
const fs = require("fs");
const path = require('path');
const storage = require('electron-json-storage');

var table=document.querySelector('#booklist');

ipcRenderer.on('library-data', (event, data) => {
	var html="";
	var entries = data.split('\r\n');
	var len = entries.length;
	var sep = '</td><td>';
	for(var i=0;i<len;i++) {
		var newrow=document.createElement("tr");
		var fields = entries[i].split('\t');
		var flen=fields.length;
		for(var j=0;j<flen;j++) {
			var newcell=document.createElement("td");
			newcell.textContent=fields[j];
			newrow.addEventListener('click', function () {
				// removed chapter argument, still need to get last position instead of 0
				mainProcess.openFile(this.getElementsByTagName("td")[4].textContent, 0); 
				window.close();
			});
			newrow.appendChild(newcell);
		}
		table.appendChild(newrow);
	}
});
	