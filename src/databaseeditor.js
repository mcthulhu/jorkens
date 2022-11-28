const { ipcRenderer } = require('electron');
const fs = require("fs");
const path = require('path');
const Tabulator = require('tabulator-tables');

function reformatDataset(collist, dataset) {
	var output=[];
	var len = dataset.length;
	for(var i=0;i<len;i++) {
		var row=dataset[i];
		var rowlen=row.length;
		var obj = {};
		obj.id=i;
		for(var j=0;j<rowlen;j++) {
			var key = collist[j];
			obj[key] = row[j];
		}
		output.push(obj);
	}
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
 		obj.headerSort=true;
		obj.headerFilter="input"; 
		obj.editor="input";
		/* obj.cellEdited=function(cell) {
			console.log('cell edited');
			var newValue = cell.getValue();
			var row=cell.getRow();
			var rowValues = row.getData();
			ipcRenderer.send('update-db-row', table, newValue, rowValues);
		}; */
		columns.push(obj);		
	}
	var datatable = new Tabulator("#database", {
		height: "95%",
		layout:"fitColumns",
		columnDefaults: {
			tooltip:true,
		}, 
		pagination:true, //enable local pagination.
		paginationSize:20, // this option can take any positive integer value (default = 10)
		selectable:true,
		columns: columns
	});
	datatable.on("tableBuilt", function(){
		datatable.setData(dataset);
	});
	datatable.on("cellEdited", function(cell) {
		console.log("cell edited");
		var newValue = cell.getValue();
		var row=cell.getRow();
		var rowValues = row.getData();
		console.log("cell edited - rowValues is " + rowValues);
		ipcRenderer.send('update-db-row', table, newValue, rowValues);
	});
	
});
