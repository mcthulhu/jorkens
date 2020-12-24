const { app, dialog, globalShortcut, remote, ipcRenderer } = require('electron');
const { BrowserWindow } = require('electron').remote;
const mainProcess = remote.require('./main.js');
const fs = require("fs");
const path = require('path');
require( 'jquery' );
require( 'datatables.net-dt' );
require( 'datatables.net-colreorder-dt' );
require( 'datatables.net-fixedheader-dt' );
require( 'datatables.net-scroller-dt' );
require( 'datatables.net-searchpanes-dt' );
require( 'datatables.net-select-dt' );
var $  = require( 'jquery' );
var dt = require( 'datatables.net' )( window, $ );

ipcRenderer.on('load-datatable', (event, table, collist, dataset) => {
	document.getElementById('table_name').textContent = "Database editor: " + table;
	var columns = [];
	for(var i=0;i<collist.length;i++){
		var obj = {};
		obj.title=collist[i];
		columns.push(obj);
	}
	// console.log(JSON.stringify(columns));
	$(document).ready(function() {
		var table = $('#database').DataTable({
			data: dataset,
			columns: columns,
			select: {
				items: 'cell',
				info: false
			}
		});
	} );
	table.select.style( 'os' );

});
