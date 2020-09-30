const { app, dialog, globalShortcut, remote, ipcRenderer } = require('electron');
const { BrowserWindow } = require('electron').remote;
const mainProcess = remote.require('./main.js');
const fs = require("fs");
const path = require('path');
var fcanswer="";
var total_asked=0;
var total_known=0;
var data;

ipcRenderer.on('flashcard-data', (event, fcdata) => {
	data = fcdata;
	getNextFlashcard();	
});

function getEl(s) {
	return(document.getElementById(s));
}

function getNextFlashcard() {
	getEl("testword").textContent="";
	getEl("testword").title = "";
	getEl("answer").textContent="";
	getEl("known").style.display="none";
	getEl("unknown").style.display="none";
	fcanswer="";
	testFlashcard(data);
	
}

function testFlashcard(data) {
	var len=data.length;
	if(len>0) {
		var rand=Math.floor(Math.random()*len);
		getEl("testword").textContent=data[rand][0];
		getEl("testword").title = data[rand][2];
		getEl("answer").textContent="(click to show answer)";
		fcanswer=data[rand][1];
	} else {
		alert("no flashcards saved");
		window.close();
	}
}


function turnOverFlashcard() {
	getEl("answer").textContent=fcanswer;
	getEl("known").style.display="inline-block";
	getEl("unknown").style.display="inline-block";
}

function processFlashcard(resp) {
	if(resp=="known") {
		total_known++;
		
	} else if(resp=="not known") {
		
	}
	total_asked++;
	getEl("fcright").textContent=total_known + "/" + total_asked;
	getNextFlashcard();
}