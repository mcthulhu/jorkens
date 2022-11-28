const { app, dialog, globalShortcut, ipcRenderer, Menu, MenuItem, BrowserWindow } = require('electron');
const fs = require("fs");
const path = require('path');
const qs = require("querystring");
const storage = require('electron-json-storage');
const Swal = require('sweetalert2')
const _ = require('underscore');
var Mousetrap = require('mousetrap');
const nlp = require('natural') ;
var timer;
book = ePub();
book2 = null;
rendition = null;
rendition2 = null;
lastLocation = null;
url = null;
locations=[];
language = "";
booktitle = "";
slider = null;

setUpMousetrapShortcuts();

window.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  ipcRenderer.send('show-context-menu');
})


function tokenizeWords(s) {
	s=s.trim();
	var words=s.split(/[\u0009\u000a\u000b\u000d\u0020\u00a0\u2000-\u2009\u200a\u2028\u2029\u202f\u3000\d\u2000-\u2069»:«,\.!)(\[\]\?;»«;:']+/u);
	words=words.filter(function(n) { return n != ""});
	return(words);
}

/* ipcRenderer.on('created-database-tables', (event) => {
	var myNotification = new Notification('', {
		body: 'initialized database tables'
	});
}); */

ipcRenderer.on('load-datatable', (event, data) => {
	console.log(data[0]);
	
	
});

ipcRenderer.on('message-box', (event, message) => {
	Swal.fire(message);
});

ipcRenderer.on('message-box-html', (event, html) => {
	Swal.fire({
		html: html,
		showConfirmButton: true,
		// timer: 3000
	});
});

ipcRenderer.on('show-notification', (event, message) => {
	const myNotification = new Notification('', {
			body: message
		});
});

ipcRenderer.on('apply-highlight', (event, title, passage, cfiRange, notes) => {
	rendition.annotations.add('highlight', cfiRange, {'annotation' : notes}, (e) => {
        var note = e.target.getAttribute("data-annotation");
		const myNotification = new Notification('', {
			body: note
		});
	});
})

ipcRenderer.on('parallel-book-opened', (event, file, content, cfi2) => {	
	book2 = ePub(file, { encoding: "binary"});
	book2.open(content, "binary");
	rendition2 = book2.renderTo('viewer2', {
      width: '100%',
	  height: 650,
      spread: 'none'
	});
	var displayed2 = rendition2.display(cfi2);
    document.getElementById('viewer').style.width = "400px";
	rendition.resize(520);
    document.getElementById('viewer2').style.width = "45%";
	document.getElementById('viewer2').style.display = "block";
	document.getElementById('viewer2').style.visibility = "hidden";
	document.getElementById('tocbox2').style.display = "block";
	document.getElementById('title2').style.display = "block";
	document.getElementById('prev2').style.display = "inline-block";
	document.getElementById('next2').style.display = "inline-block";
	document.getElementById('next').style.right = "550px";
	book2.ready.then(() => {
		var booktitle2=book2.package.metadata.title;
		 var author2 = book2.package.metadata.creator;
		var language2=book2.package.metadata.language;
		language2=language2.substring(0, 2);
		if(language2 == 'UN') {
			language2 = ipcRenderer.sendSync('get-native');
		}
		document.getElementById("title2").textContent=author2 + " - " + booktitle2 + " (" + language2 + ")";
		var next2 = document.getElementById("next2");
		next2.addEventListener("click", function(e){
			rendition2.next();
			e.preventDefault();
		}, false);

		var prev2 = document.getElementById("prev2");
		prev2.addEventListener("click", function(e){
			rendition2.prev();
			e.preventDefault();
		}, false);

		
	});
	book2.loaded.navigation.then(function(toc){

			var $select2 = document.getElementById("toc2"),
					docfrag = document.createDocumentFragment();

			toc.forEach(function(chapter) {
				var option = document.createElement("option");
				option.textContent = chapter.label;
				option.ref = chapter.href;

				docfrag.appendChild(option);
			});

			$select2.appendChild(docfrag);

			$select2.onchange = function(){
					var index = $select2.selectedIndex,
							url = $select2.options[index].ref;
					rendition2.display(url);
					return false;
			};


		});
	rendition2.on("relocated", function(){
		var currentLocation2 = rendition2.currentLocation();
		var cfi2 = currentLocation2.start.cfi;
		ipcRenderer.send('update-parallel-book-location', file, cfi2);
	});

	 rendition2.themes.default({
      h2: {
        'font-size': '32px',
        color: 'purple'
      },
      p: {
        "margin": '10px'
      }
    });
	let currentTheme = ipcRenderer.sendSync('get-theme');
	rendition2.themes.select(currentTheme);
    
    rendition2.themes.fontSize("120%");
})


ipcRenderer.on('jump-to-search-result', (event, cfi) => {
	rendition.display(cfi);
});

ipcRenderer.on('text-richness', (event, textRich) => {
	document.getElementById("ttr").textContent = "TTR: " + textRich;
});


ipcRenderer.on('change-theme', (event, mode) => {
	rendition.themes.select(mode);
});

ipcRenderer.on('update-fc-count', (event, fccount) => {
	document.getElementById('fccount').textContent = "Flashcards: " + fccount;
});


ipcRenderer.on('update-gloss-count', (event, glosscount) => {
	document.getElementById('glosscount').textContent = "Glossary: " + glosscount;
});

ipcRenderer.on('update-tm-count', (event, tmcount) => {
	document.getElementById('tmcount').textContent = "TM: " + tmcount;
});

ipcRenderer.on('start-flashcard-review', (event, data) => {
	var fwin= new BrowserWindow({
		show: false,
		width: 600,
		height: 400,
		frame: false,
		alwaysOnTop: true,
		webPreferences: {
			nodeIntegration: true
		}
	});
	fwin.loadFile(path.join(__dirname, 'flashcard_review.html'));
	fwin.webContents.once('did-finish-load', () => {
		fwin.webContents.send('flashcard-data', data);
	});
	fwin.once('ready-to-show', () => {
		fwin.show();
		//fwin.webContents.openDevTools();
	});
	fwin.on('closed', () => {
		fwin = null;
    });
});

ipcRenderer.on('got-translation', (event, translation) => {
	Swal.fire(translation);
});

ipcRenderer.on('get-native-language', async (event, oldlanguage) => {
	const { value: newlanguage } = await Swal.fire({
		title: 'Enter the digraph for your native language (in lowercase):',
		input: 'text',
		//inputLabel: 'Your IP address',
		inputValue: oldlanguage,
		showCancelButton: true
	})
	if (newlanguage) {
	  ipcRenderer.send('save-native-language', newlanguage);
    }
});

ipcRenderer.on('get-foreign-language', async (event, oldlanguage) => {
	const { value: forlanguage } = await Swal.fire({
		title: "Enter the digraph for the book's correct language (in lowercase): ",
		input: 'text',
		inputValue: oldlanguage,
		showCancelButton: true
	})
	if (forlanguage) {	
      ipcRenderer.send('save-foreign-language', forlanguage);
	  var title = document.getElementById("title").textContent;
	  language = forlanguage;
	  document.getElementById("title").textContent =title.replace(/\([a-z][a-z]\)/, "(" + forlanguage + ")");
	  ipcRenderer.send('enable-dictionaries');
    }
});


ipcRenderer.on('get-user-email', async (event, oldaddress) => {
	const { value: emailaddress } = await Swal.fire({
		title: 'Enter your email address:',
		input: 'text',
		inputValue: oldaddress,
		showCancelButton: true
})
	if (emailaddress) {
	  ipcRenderer.send('save-email-address', emailaddress);
    }
});

ipcRenderer.on('get-global-voices-url', async(event) => {
	const { value: url } = await Swal.fire({
		title: 'Enter the URL of a Global Voices article',
		input: 'text',
		showCancelButton: true
	})
	ipcRenderer.send('global-voices', url);
});

ipcRenderer.on('get-search-term', async (event) => {
	const { value: searchTerm } = await Swal.fire({
		title: 'Enter your search term',
		input: 'text',
		showCancelButton: true
	})

	doSearch(searchTerm).then((result) => {
		for(let hit of result) {
			var spineitem = book.spine.get(hit.cfi);
			var navitem = book.navigation.get(spineitem.href);
			if(navitem) {
				hit.section = navitem.label;
				hit.section = hit.section.trim();
			}
		}
		
		ipcRenderer.send('display-search-results', result);
	})
});

ipcRenderer.on('replace-words', (event, replacements) => {
	var iframe = document.querySelector("div div div div iframe");	
	var html=iframe.contentDocument.documentElement.innerHTML;
	var len=replacements.length;
	for(var i=0;i<len;i++) {
		var re = new RegExp(" " + replacements[i][0] + " ", "gi");
		html=html.replace(re, " " + replacements[i][1] + " ");
	}
	iframe.contentDocument.documentElement.innerHTML = html;	
})

ipcRenderer.on('make-toolbar-buttons', (event, items) => {
	items = JSON.parse(JSON.stringify(items));
	for(let i=0;i<items.length;i++) {
		let thismenuitem = items[i];
		var btn=document.createElement('button');
		btn.title = items[i].label;
		btn.textContent=(i+1).toString();
		btn.onclick = function() {
			ipcRenderer.send('get-create-search-window', items[i].label);
		}							
		var tbar = document.getElementById('toolbar');
		tbar.appendChild(btn);
	}	
});

function setUpControls() {
	var controls = document.getElementById("controls");
   var currentPage = document.getElementById("current-percent");
   var sliders = document.getElementsByTagName("input");
   if(sliders.length == 1) {
	    slider = document.createElement("input");
   }
	var slide = function(){
		var cfi = book.locations.cfiFromPercentage(slider.value / 100);
		rendition.display(cfi);
	};
					controls.style.display = "block";
				slider.setAttribute("type", "range");
				slider.setAttribute("min", 0);
				slider.setAttribute("max", 100);
				slider.setAttribute("step", 1);
				slider.setAttribute("value", 0);

				slider.addEventListener("change", slide, false);
				slider.addEventListener("mousedown", function(){
						mouseDown = true;
				}, false);
				slider.addEventListener("mouseup", function(){
						mouseDown = false;
				}, false);

   var mouseDown = false;
   var next = document.getElementById("next");

      next.addEventListener("click", function(e){
        book.package.metadata.direction === "rtl" ? rendition.prev() : rendition.next();
        e.preventDefault();
      }, false);

      var prev = document.getElementById("prev");
      prev.addEventListener("click", function(e){
        book.package.metadata.direction === "rtl" ? rendition.next() : rendition.prev();
        e.preventDefault();
      }, false);

      var keyListener = function(e){

        // Left Key
        if ((e.keyCode || e.which) == 37) {
          book.package.metadata.direction === "rtl" ? rendition.next() : rendition.prev();
        }

        // Right Key
        if ((e.keyCode || e.which) == 39) {
          book.package.metadata.direction === "rtl" ? rendition.prev() : rendition.next();
        }
	  };
	 document.addEventListener("keyup", keyListener, false);

}

const getCircularReplacer = () => {
      const seen = new WeakSet();
      return (key, value) => {
        if (typeof value === "object" && value !== null) {
          if (seen.has(value)) {
            return;
          }
          seen.add(value);
        }
        return value;
      };
    };
	
ipcRenderer.on('file-opened', (event, file, content, position) => { // removed chapter argument
  setUpControls();
  var currentPage = document.getElementById("current-percent");
  url = file;
  book=null;
  book=ePub(file, { encoding: "binary"});
 
  book.open(content, "binary");
  rendition = book.renderTo("viewer", {
      width: "100%",
      height: 650,
	  spread: "auto"
    });
    var displayed = rendition.display(position);

	//rendition.on("keyup", keyListener); 
	
	var bookdata="";
	
	 book.ready.then(() => {
		 book.spine.hooks.serialize.register((output, section) => {
			 bookdata+=output;
		 });
		 booktitle=book.package.metadata.title;
		 ipcRenderer.send('update-booktitle', booktitle);
		 var author = book.package.metadata.creator;
		var language=book.package.metadata.language;
		language=language.substring(0, 2);
		document.getElementById("title").textContent=author + " - " + booktitle + " (" + language + ")";
		// document.getElementById("toc").selectedIndex = chapter;
		 ipcRenderer.send('update-language', language);
		 ipcRenderer.send('finish-setup', booktitle, author, url, language);
	   timer=setInterval(updateTimer, 1000);
		 var key = book.key()+'-locations';
			var stored = localStorage.getItem(key);
			if (stored && stored.length > 3) {
				return book.locations.load(stored);			
			} else {
				return book.locations.generate(1024)
			}
	 })
			.then(function(locations){
				ipcRenderer.send('save-locations', booktitle, locations);
				ipcRenderer.send('update-last-location', locations[locations.length - 1]);

				// Wait for book to be rendered to get current page
				displayed.then(function(){
						// Get the current CFI
						var currentLocation = rendition.currentLocation();
						// Get the Percentage (or location) from that CFI
						var currentPage = book.locations.percentageFromCfi(currentLocation.start.cfi);
						slider.value = currentPage;
						currentPage.value = currentPage;
				});

				controls.appendChild(slider);

				currentPage.addEventListener("change", function(){
					var cfi = book.locations.cfiFromPercentage(currentPage.value/100);
					rendition.display(cfi);
				}, false);

				

				// Save out the generated locations to JSON
				localStorage.setItem(book.key()+'-locations', book.locations.save());
				locations=book.locations;
				ipcRenderer.send('save-locations', booktitle, locations);
		});

    var title = document.getElementById("title");
	ipcRenderer.send('get-book-contents');
    rendition.on("rendered", function(section){
		var currentChapter= rendition.getContents()[0].content.textContent;
		lemmatize(currentChapter);
      var current = book.navigation && book.navigation.get(section.href);
	  
      if (current) {
        var $select = document.getElementById("toc");
        var $selected = $select.querySelector("option[selected]");
        if ($selected) {
          $selected.removeAttribute("selected");
        }

        var $options = $select.querySelectorAll("option");
		
        for (var i = 0; i < $options.length; ++i) {
          let selected = $options[i].getAttribute("ref") === current.href;
          if (selected) {
            $options[i].setAttribute("selected", "");
          }
        }
      }
		setUpContextMenu();
		configureToolbarButtons();
    });

    rendition.on("relocated", function(location){
		// Listen for location changed event, get percentage from CFI
		var percent = book.locations.percentageFromCfi(location.start.cfi);
		var percentage = Math.floor(percent * 100);
		//if(!mouseDown) {
			// follow line produces Linux error - slider is null
			slider.value = percentage;
		//}
		currentPage.value = percentage;
				
      var next = book.package.metadata.direction === "rtl" ?  document.getElementById("prev") : document.getElementById("next");
      var prev = book.package.metadata.direction === "rtl" ?  document.getElementById("next") : document.getElementById("prev");

      if (location.atEnd) {
        next.style.visibility = "hidden";
      } else {
        next.style.visibility = "visible";
      }

      if (location.atStart) {
        prev.style.visibility = "hidden";
      } else {
        prev.style.visibility = "visible";
      }
		lastLocation=rendition.currentLocation().start.cfi;
		ipcRenderer.send('update-config-location', url, lastLocation);
		ipcRenderer.send('update-last-location', lastLocation);
		let spineItem = book.spine.get(lastLocation);
        let navItem = book.navigation.get(spineItem.href);
		if(navItem && navItem.id) {
			var navpoint = navItem.id.split('-')[1];
			if(navpoint) {
				navpoint=navpoint.trim(); // doesn't work for navpoint without -
				document.getElementById('toc').selectedIndex = navpoint - 1;
			}
		}
		
		// put lemmatization here
		getVisibleText();
    });
	
	//book.spine.hooks.serialize.register((output, section) => {
		// section.output = output.replace("Los", "LosLos"); // test
		//console.log("serialize hook: about to call lemmatize");
		//lemmatize(section.output);
	//});
	
    rendition.on("layout", function(layout) {
      let viewer = document.getElementById("viewer");

      if (layout.spread) {
        viewer.classList.remove('single');
      } else {
        viewer.classList.add('single');
      }
    });
	
	

	var checkGlossary = function(cfiRange, contents) {
		book.getRange(cfiRange).then((range) => {
                if (range) {
                    let text = range.toString();
					ipcRenderer.send('update-selection', text);
                    let paragraph = range.startContainer.data;
					var regexp = /[^\.\!\?。、「」『』〜・？！（）【】]*[\.\!\?。、「」『』〜・？！（）【】]/g;
					var sentences = paragraph.match(regexp);
					if(sentences) {
						var senlen = sentences.length;
						for(var i=0;i<senlen;i++) {
							if(sentences[i].includes(text)) {
								ipcRenderer.send('update-context-sentence', sentences[i]);
							}
						}
					}					
					
					ipcRenderer.send('update-cfi-range', cfiRange);
					var docpath = ipcRenderer.sendSync('get-docpath');
					var fn = path.join(docpath, 'Jorkens', 'selection.txt');
					fs.writeFile(fn, text, function(err) {
						if(err) {
							return console.log(err);
						} 				
					});
					
					ipcRenderer.send('glossary-search', text);
				}
			});
	}
	
	rendition.on("selected", checkGlossary);
	
    window.addEventListener("unload", function () {
      this.book.destroy();
    });
    book.loaded.navigation.then(function(toc){
				parshToc(book);
			var $select = document.getElementById("toc"),
				docfrag = document.createDocumentFragment();

			toc.forEach(function(chapter) {
				var option = document.createElement("option");
				option.textContent = chapter.label;
				option.setAttribute("ref", chapter.href);
				docfrag.appendChild(option);
			});

			$select.appendChild(docfrag);
			$select.onchange = function(){
					var index = $select.selectedIndex,
							url = $select.options[index].getAttribute("ref");
					// save current chapter location to config
					rendition.display(url);
					return false;
			};

		});
	rendition.hooks.content.register(function(contents, view) {
		rendition.themes.register("dark", "css/themes.css");
		rendition.themes.register("light", "css/themes.css");
		rendition.themes.register("sepia", "css/themes.css");
		rendition.themes.register("lavender", "css/themes.css");
		rendition.themes.register("lavenderonblue", "css/themes.css");
		rendition.themes.register("nord", "css/themes.css");
		rendition.themes.register("rubyblue", "css/themes.css");
		rendition.themes.register("greenonblack", "css/themes.css");

		rendition.themes.default({
			h2: {
				'font-size': '32px',
			color: 'purple'
		},
		p: {
			"margin": '10px'
		}
		});
	
		let currentTheme = ipcRenderer.sendSync('get-theme');
		rendition.themes.select(currentTheme);
	});
    
    rendition.themes.fontSize("120%");
	

			
		
			//const el2 = document.querySelector("div div div div iframe");
			// el2.contentWindow.oncontextmenu = checkRightClick;
			
		});	
	 
	//});

	
//});

ipcRenderer.on('get-session-stats', () => {
	var stats = {};
	stats.readingTime = document.getElementById("clock").textContent;
	ipcRenderer.sendSync('session-stats', stats);
});

ipcRenderer.on('clear-book', () => {
	clearInterval(timer);
	document.getElementById("current-percent").value = 0;
    document.getElementsByTagName("input")[0].value = 0;
	document.getElementById("clock").textContent='00:00:00';
	book.destroy();
	var divs=document.querySelectorAll("div[id^='epubjs-container']");
	if(divs) {
		divs.forEach(function(div) {
			div.remove();
		});
	}
	var $select = document.getElementById("toc");
	$select.options.length = 0;
	//book = ePub();
	book2 = null;
	rendition = null;
	rendition2 = null;
	lastLocation = null;
	url = null;
	locations=[];
	language = "";
	booktitle = "";
	document.getElementById("title").textContent='';
	// todo: set lastLocation back to beginning and save
});

function setUpContextMenu() {
	//var language = ipcRenderer.sendSync('get-language');
	var iframe = document.querySelector("div div div div iframe");	
	iframe.contentDocument.addEventListener('contextmenu', (e) => {
		e.preventDefault();
		var range, textNode, offset;
			
				range = iframe.contentWindow.document.caretRangeFromPoint(e.clientX, e.clientY);
				textNode = range.startContainer;
				offset = range.startOffset;
				var data = textNode.data,
				i = offset,
				begin,
				end;
				//Find the begin of the word (space)
				while (i > 0 && data[i] !== " ") { --i; };
				begin = i;

					//Find the end of the word
				i = offset;
				while (i < data.length && data[i] !== " ") { ++i; };
				end = i;
				//Return the word under the mouse cursor
				var hoverword = data.substring(begin, end);
				hoverword = hoverword.trim().toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '');
				// need to normalize here
				ipcRenderer.send('update-selection', hoverword);
			
		ipcRenderer.send('show-context-menu');
		}, false);
}

function configureToolbarButtons() {
	document.getElementById('wfbutton').addEventListener("click", function() {
		ipcRenderer.send('create-search-window', 'wf');;
	});
	document.getElementById('addbutton').addEventListener("click", function() {
		ipcRenderer.send('create-gloss-window');
	});
	document.getElementById('openbutton').addEventListener("click", function() {
		ipcRenderer.send('choose-book');
	});
	document.getElementById('findbutton').addEventListener("click", function() {
		ipcRenderer.send('get-search-term');
	});
	document.getElementById('glbutton').addEventListener("click", function() {
		ipcRenderer.send('search-glosbe-dictionary');
	});
	document.getElementById('gtbutton').addEventListener("click", function() {
		ipcRenderer.send('create-search-window', 'google-translate');
	});
	document.getElementById('forvobutton').addEventListener("click", function() {
		ipcRenderer.send('create-search-window', 'forvo');
	});
	document.getElementById('ttsbutton').addEventListener("click", function() {
		ipcRenderer.send('windows-tts');
	});
	document.getElementById('verbixbutton').addEventListener("click", function() {
		 ipcRenderer.send('create-search-window', 'verbix');
	});
	document.getElementById('wiktbutton').addEventListener("click", function() {
		ipcRenderer.send('create-search-window', 'wik');
	});
	document.getElementById('parbutton').addEventListener("click", function() {
		ipcRenderer.send('load-parallel-book');
	});
	document.getElementById('ankibutton').addEventListener("click", function() {
		ipcRenderer.send('run-anki');
	});
}

ipcRenderer.on('get-range-contents', (a, b) => {
	var range = rendition.getRange(a);
	var endRange = rendition.getRange(b);
	range.setEnd(endRange.startContainer, endRange.startOffset);
	ipcRenderer.sendSync('got-text', range.toString());
});

ipcRenderer.on('get-book-contents', (event, fn) => {
	book.loaded.spine.then((spine) => {
		spine.each((item) => {
			const thisitem = book.spine.get(item.href);
			thisitem.load(book.load.bind(book)).then(() => {
				const doc=thisitem.document;
				const el = doc.evaluate(
					"//*[name() = 'body']", // the name function avoids the namespace problem
					doc,
					prefix => prefix === 'epub' ? 'http://www.idpf.org/2007/ops' : null,
					XPathResult.ANY_TYPE,
					null
				).iterateNext();
				if(el) {
					fs.appendFileSync(fn, el.textContent);
				}
			
			})
	
		
	
	});
	// mainProcess.calculateTypeTokenRatio();	
/* 	const myNotification = new Notification('', {
		body: 'book contents exported to text'
	}); */
	});

});

function setUpMousetrapShortcuts() {
	Mousetrap.bind(['command+shift+w', 'ctrl+shift+w'], function() {
		ipcRenderer.send('create-search-window', 'wf');
		return false;
	});
		
}
      
function updateTimer() {
	var timer=document.getElementById("clock");
	var timertext=timer.textContent;
	var pieces=timertext.split(":");
	var seconds=parseInt(pieces[2]);
	var minutes=parseInt(pieces[1]);
	var hours=parseInt(pieces[0]);
	seconds++;
	if(seconds==60) {
		seconds=0;
		minutes++;
	}
	if(minutes==60) {
		minutes=0;
		hours++;
	}
	var newtext=pad(hours) + ":" + pad(minutes) + ":" + pad(seconds);
	timer.textContent=newtext;
} 

function pad(num) {
	var digits=num.toString();
	if(digits.length<2) {
		digits="0" + digits;
	}
	return(digits);
}

function doSearch(q) {
    return Promise.all(
        book.spine.spineItems.map(item => item.load(book.load.bind(book)).then(item.find.bind(item, q)).finally(item.unload.bind(item)))
    ).then(results => Promise.resolve([].concat.apply([], results))); 
}

function lemmatize(currentChapter) {
			var language = ipcRenderer.sendSync('get-language');
			// var currentChapter=contents.content.textContent;

			var tokens = tokenizeWords(currentChapter);
			tokens = _.uniq(tokens);
			if(tokens.length == 0) {
				console.log("no tokens found");
				return;
			}
			if(process.platform == 'win32') {				
				tokens=tokens.join('\r\n');
			} else if(process.platform == 'linux') {
				var tokens = tokens.join('\n');
			}
			
			var docpath = ipcRenderer.sendSync('get-docpath');
			var fn = path.join(docpath, 'Jorkens', 'currentChapter.txt');
			fs.writeFile(fn, currentChapter, function(err) {
				if(err) {
					return console.log(err);
				} 				
			});
			var fn = path.join(docpath, 'Jorkens', 'tokens.txt');
			fs.writeFile(fn, tokens, function(err) {
				if(err) {
					return console.log(err);
				} else {
					var stanzalanguages = ['ar', 'bg', 'ca', 'cs', 'da', 'de', 'el', 'en', 'es', 'fa', 'fi', 'fr', 'he', 'hi', 'hr', 'hu', 'id', 'it', 'ja', 'ko', 'la', 'nb', 'nl', 'pl', 'pt', 'ro', 'ru', 'sl', 'sr', 'sv', 'tr', 'ur', 'vi', 'zh-hans'];
					if(stanzalanguages.includes(language)) {
						ipcRenderer.send('stanza-lemmatizer'); 
					} else {
						ipcRenderer.send('tree-tagger'); 
					}

				}				
			});
}

// function from https://github.com/Janglee123/eplee/blob/93797e87de7fc9f25d2b3c97e77ac4d3b2e90219/src/shared/dbUtilis.js#L54
function parshToc(book) {  
  const { toc } = book.navigation;
  const { spine } = book;
  
  /**
   * some epubs not uese standerd href or epubjs fails to process them
   * @param {String} href  The href to validate
   * @returns {String} href
   */
  const validateHref = href => {
    if (href.startsWith('..')) {
      href = href.substring(2);
    }
    if (href.startsWith('/')) {
      href = href.substring(1);
    }
    return href;
  };

  /** 
   * Return spin part from href 
   * 
   * TL;DR
   * Toc item points exact postion of chapter or subChapter by using hase ID
   * in href. In more genrale href looks like ch001#title.
   * The ch001 is spine item and title is element id for which tocitem is.
   * We can get cfi of toc from this two item.
   * 
   * @param {String} href - The herf to get spine component 
   * @returns {String} - The Spine item href
   */
  const getSpineComponent = href => { 
    return href.split('#')[0];
  }

  /**
   * Returns elementId part of href 
   * @param {String} href 
   */
  const getPositonComponent = href => { 
    return href.split('#')[1];
  }

  const tocTree = [];

  /**
   * recursively go through toc and parsh it
   * @param {toc} toc
   * @param {parrent} parrent
   */
  const createTree = (toc, parrent) => {
    for (let i = 0; i < toc.length; i += 1) {

      // get clean href
      const href = validateHref(toc[i].href);
      
      // get spin and elementId part from href
      const spineComponent = getSpineComponent(href);   
      const positonComponent = getPositonComponent(href);

      // get spinItem from href
      const spineItem = spine.get(spineComponent);
      
      // load spin item
      spineItem.load(book.load.bind(book)).then(() => {

        // get element by positionComponent which is basically elementId
        const el = spineItem.document.getElementById(positonComponent);
        // get cfi from element
        const cfi = spineItem.cfiFromElement(el);
        // get percent from cfi
        const percentage = book.locations.percentageFromCfi(cfi);
        
        // toc item which has
        parrent[i] = {
          label: toc[i].label.trim(),
          children: [],
          href,
          cfi,
          percentage,
        };

        // if toc has subitems recursively parsh it
        if (toc[i].subitems) {
          createTree(toc[i].subitems, parrent[i].children);
        }

      });
    }
  };

  createTree(toc, tocTree);
}

function getVisibleText() {
	var range = rendition.getRange(rendition.currentLocation().start.cfi);
    var endRange = rendition.getRange(rendition.currentLocation().end.cfi);
    range.setEnd(endRange.startContainer, endRange.startOffset);
	ipcRenderer.send('update-text-read', range.toString());
}
