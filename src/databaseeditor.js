const { app, dialog, globalShortcut, remote, ipcRenderer } = require('electron');
const { BrowserWindow } = require('electron').remote;
const mainProcess = remote.require('./main.js');
const fs = require("fs");
const path = require('path');
/* require( 'jquery' );
require( 'datatables.net-dt' );
require( 'datatables.net-colreorder-dt' );
require( 'datatables.net-fixedheader-dt' );
require( 'datatables.net-scroller-dt' );
require( 'datatables.net-searchpanes-dt' );
require( 'datatables.net-select-dt' );
var $  = require( 'jquery' );
var dt = require( 'datatables.net' )( window, $ ); */
var Tabulator = require('tabulator-tables');

function reformatDataset(collist, dataset) {
	var output=[];
	var len = dataset.length;
	for(var i=0;i<len;i++) {
		var row=dataset[i];
		var rowlen=row.length;
		var obj = {};
		obj.id=i;
		for(var j=0;j<rowlen;j++) {
			// console.log(row[j], collist[j]);
			var key = collist[j];
			obj[key] = row[j];
		}
		output.push(obj);
	}
	// console.log(JSON.stringify(output));
	return(output);
}

ipcRenderer.on('load-datatable', (event, table, collist, dataset) => {
	dataset = reformatDataset(collist, dataset);
	document.getElementById('table_name').textContent = "Database editor: " + table;
	var columns = [];
 	for(var i=0;i<collist.length;i++){
		var obj = {};
		obj.title=collist[i];
		obj.field=collist[i];
		obj.resizable=true;
		// obj.frozen=true;
 		obj.headerSort=true;
		obj.headerFilter="input"; 
		obj.editor="input";
		columns.push(obj);
	}
	//console.log(JSON.stringify(columns));
	//console.log(dataset);
	/*
	
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
 */
	var datatable = new Tabulator("#database", {
		height: "95%",
		layout:"fitColumns",
		tooltips: true,
		 pagination:"local", //enable local pagination.
		paginationSize:20, // this option can take any positive integer value (default = 10)
		selectable:true,
		data: dataset,
		columns: columns,
		tableBuilt:function(){
		},
		cellEdited:function(cell){
			var newValue = cell.getValue();
			var row=cell.getRow();
			var rowValues = row.getData();
			mainProcess.updateDBRow(table, newValue, rowValues);
		},
	
	});
	datatable.addData(dataset);
	// datatable.redraw();
});
