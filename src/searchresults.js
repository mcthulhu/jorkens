const { app, dialog, globalShortcut, remote, ipcRenderer } = require('electron');
const { BrowserWindow } = require('electron').remote;
const mainProcess = remote.require('./main.js');
const fs = require("fs");
const path = require('path');
var table=document.querySelector('#searchresultlist');

ipcRenderer.on('search-results-data', (event, results) => {
	var html="";
	var len = results.length;
	for(var i=0;i<len;i++) {
		var newrow=document.createElement("tr");
		var section = results[i].section;
		var cfi=results[i].cfi;
		var excerpt=results[i].excerpt;
		var cell1=document.createElement("td");
		cell1.textContent=section;
		var cell2=document.createElement("td");
		cell2.textContent=cfi;
		cell2.style.display="none";
		var cell3=document.createElement("td");
		cell3.textContent=excerpt;
		newrow.appendChild(cell1);
		newrow.appendChild(cell2);
		newrow.appendChild(cell3);
		newrow.addEventListener('click', function () {
			var location = this.getElementsByTagName("td")[1].textContent;
				mainProcess.jumpToSearchResult(location); 
			
				// window.close();
			});
		
	
		table.appendChild(newrow);
	}
});

