const { app, dialog, globalShortcut, ipcRenderer } = require('electron');
const fs = require("fs");
const path = require('path');
const storage = require('electron-json-storage');
var table=document.querySelector('#notelist');

ipcRenderer.on('annotation-data', (event, data) => {
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
			if(j==3) {
				newcell.style.display="none";
			}
			newcell.textContent=fields[j];
			newrow.addEventListener('click', function () {
				var location = this.getElementsByTagName("td")[3].textContent;
				ipcRenderer.send('jump-to-search-result', location); 
				window.close();
			});
			newrow.appendChild(newcell);
		}
		table.getElementsByTagName('tbody')[0].appendChild(newrow);
	}
});
// table filtering code from https://speedysense.com/filter-html-table-using-javascript/
     (function(document) {
            'use strict';

            var TableFilter = (function(myArray) {
                var search_input;

                function _onInputSearch(e) {
                    search_input = e.target;
                    var tables = document.getElementsByClassName(search_input.getAttribute('data-table'));
                    myArray.forEach.call(tables, function(table) {
                        myArray.forEach.call(table.tBodies, function(tbody) {
                            myArray.forEach.call(tbody.rows, function(row) {
                                var text_content = row.textContent.toLowerCase();
                                var search_val = search_input.value.toLowerCase();
                                row.style.display = text_content.indexOf(search_val) > -1 ? '' : 'none';
                            });
                        });
                    });
                }

                return {
                    init: function() {
                        var inputs = document.getElementsByClassName('search-input');
                        myArray.forEach.call(inputs, function(input) {
                            input.oninput = _onInputSearch;
                        });
                    }
                };
            })(Array.prototype);

            document.addEventListener('readystatechange', function() {
                if (document.readyState === 'complete') {
                    TableFilter.init();
                }
            });

        })(document);
		
function exportToCSV()	 {
	
}