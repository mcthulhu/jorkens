const { app, dialog, globalShortcut, ipcRenderer } = require('electron');
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
				ipcRenderer.send('jump-to-search-result', location); 
				window.close();
			});
		
	
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