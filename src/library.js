const { app, dialog, globalShortcut, ipcRenderer } = require('electron');
const fs = require("fs");
const path = require('path');
const storage = require('electron-json-storage');
var Mousetrap = require('mousetrap');
var table=document.querySelector('#booklist');
var tbody=table.getElementsByTagName('tbody')[0];

ipcRenderer.on('library-data', (event, data) => {
	var html="";
	var entries = data.split('\r\n');
	var len = entries.length;
	var lastlang='';
	var sep = '</td><td>';
	for(var i=0;i<len;i++) {
		var newrow=document.createElement("tr");
		var fields = entries[i].split('\t');
		if(fields[0] != lastlang) {
			lastlang=fields[0];
			var langrow=document.createElement('tr');
			var langcell=document.createElement('td');
			langcell.textContent=lastlang;
			langcell.setAttribute('colspan', '6');
			langcell.setAttribute('style', 'text-align:center;font-weight:bold');
			langrow.appendChild(langcell);
			langrow.addEventListener('click', function (event) {
				var lang=this.textContent;
				var theserows=document.getElementsByClassName('child-' + lang);
				for(var i=0;i<theserows.length;i++) {
					theserows[i].classList.toggle('hidden');
				}
			});
			tbody.appendChild(langrow);
		}
		if(fields[6] == 1) {
			newrow.className = 'secret';
			
		}
		var flen=fields.length;
		for(var j=0;j<flen-1;j++) {
			var newcell=document.createElement("td");
			newcell.textContent=fields[j];
			
			newrow.appendChild(newcell);
			
		}
		if(!newrow.className) {
				newrow.className='child-' + lastlang;
			}
		newrow.addEventListener('click', function () {
				// removed chapter argument, still need to get last position instead of 0
				ipcRenderer.send('open-file', this.getElementsByTagName("td")[4].textContent, 0); 
				window.close();
			});
				
		newrow.classList.add('hidden');
		tbody.appendChild(newrow);
	}
});

Mousetrap.bind('ctrl+shift+k', () => {
	console.log("mousetrap");
	var rows = table.getElementsByTagName('tr');
	var len = rows.length;
	for(var i=0;i<len;i++) {
		rows[i].className = '';
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