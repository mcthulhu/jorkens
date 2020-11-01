const { app, dialog, globalShortcut, remote, ipcRenderer } = require('electron');
const { BrowserWindow } = require('electron').remote;
const mainProcess = remote.require('./main.js');
const fs = require("fs");
const path = require('path');
const qs = require("querystring");
const { Menu, MenuItem } = remote
const storage = require('electron-json-storage');
const Swal = require('sweetalert2')
const _ = require('underscore');
var Mousetrap = require('mousetrap');
const nlp = require('natural') ;

book = ePub();
book2 = null;
rendition = null;
rendition2 = null;
lastLocation = null;
url = null;
locations=[];
language = "";
booktitle = "";

setUpMousetrapShortcuts();

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

ipcRenderer.on('message-box', (event, message) => {
	Swal.fire(message);
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
	console.log("opening parallel book: " + file, cfi2);
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
			language2 = require('electron').remote.getGlobal('sharedObject').native;
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
		mainProcess.updateParallelBookLocation(file, cfi2);
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
	if(require('electron').remote.getGlobal('sharedObject').theme) {
		rendition2.themes.select(require('electron').remote.getGlobal('sharedObject').theme);
	} else {
		rendition2.themes.select("sepia");
	}
    
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
      mainProcess.saveNativeLanguage(newlanguage);
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
      mainProcess.saveForeignLanguage(forlanguage);
	  var title = document.getElementById("title").textContent;
	  language = forlanguage;
	  document.getElementById("title").textContent =title.replace(/\([a-z][a-z]\)/, "(" + forlanguage + ")");
	  mainProcess.enableDictionaries();
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
      mainProcess.saveEmailAddress(emailaddress);
    }
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
		
		mainProcess.displaySearchResults(result);
	})
});

ipcRenderer.on('file-opened', (event, file, content, position) => { // removed chapter argument
  if(file.endsWith('epub')) {
	  // console.log("this is an epub"); -- works
  }
  var controls = document.getElementById("controls");
   var currentPage = document.getElementById("current-percent");
   var sliders = document.getElementsByTagName("input");
   if(sliders.length == 1) {
	    var slider = document.createElement("input");
   }
   // console.log(sliders);
	var slide = function(){
		var cfi = book.locations.cfiFromPercentage(slider.value / 100);
		rendition.display(cfi);
	};
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
   
  url = file;
  book=ePub(file, { encoding: "binary"});
  book.open(content, "binary");
  
  rendition = book.renderTo("viewer", {
      width: "100%",
      height: 650,
	  spread: "auto"
    });

    var displayed = rendition.display(position);
	rendition.on("keyup", keyListener); // not defined??
    document.addEventListener("keyup", keyListener, false);
	var bookdata="";

	 book.ready.then(() => {
		 book.spine.hooks.serialize.register((output, section) => {
			 bookdata+=output;
			 //console.log(bookdata);
		 });
		 booktitle=book.package.metadata.title;
		 require('electron').remote.getGlobal('sharedObject').booktitle = booktitle;
		 var author = book.package.metadata.creator;
		var language=book.package.metadata.language;
		language=language.substring(0, 2);
		document.getElementById("title").textContent=author + " - " + booktitle + " (" + language + ")";
		// document.getElementById("toc").selectedIndex = chapter;
		require('electron').remote.getGlobal('sharedObject').language=language;
		mainProcess.enableDictionaries();
		mainProcess.buildPythonMenu();
	   mainProcess.addToRecent(booktitle, author, url, language);
      mainProcess.updateDBCounts();
	  mainProcess.applyPassages();
	  var timer=setInterval(updateTimer, 1000);
		 var key = book.key()+'-locations';
			var stored = localStorage.getItem(key);
			if (stored && stored.length > 3) {
				return book.locations.load(stored);			
			} else {
				console.log("generating book locations");
				return book.locations.generate(1024)
			}
	 })
			.then(function(locations){
				mainProcess.saveLocations(booktitle, locations);
				require('electron').remote.getGlobal('sharedObject').firstLocation = locations[0];
				require('electron').remote.getGlobal('sharedObject').lastLocation = locations[locations.length - 1];
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

				// Wait for book to be rendered to get current page
				displayed.then(function(){
						// Get the current CFI
						var currentLocation = rendition.currentLocation();
						// Get the Percentage (or location) from that CFI
						var currentPage = book.locations.percentageFromCfi(currentLocation.start.cfi);
						// console.log("currentPage is " + currentPage);
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
				require('electron').remote.getGlobal('sharedObject').locations = locations;

		});

    var title = document.getElementById("title");
	mainProcess.getBookContents();
    rendition.on("rendered", function(section){
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

    });

    rendition.on("relocated", function(location){
		// Listen for location changed event, get percentage from CFI
		var percent = book.locations.percentageFromCfi(location.start.cfi);
		var percentage = Math.floor(percent * 100);
		if(!mouseDown) {
			// follow line produces Linux error - slider is null
			slider.value = percentage;
		}
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
		mainProcess.updateConfigLocation(url, lastLocation);
		require('electron').remote.getGlobal('sharedObject').lastLocation = lastLocation;
		
		let spineItem = book.spine.get(lastLocation);
        let navItem = book.navigation.get(spineItem.href);
		var navpoint = navItem.id.split('-')[1].trim();
		document.getElementById('toc').selectedIndex = navpoint - 1;
		
    });

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
                    let paragraph = range.startContainer.data;
					var regexp = /[^\.\!\?]*[\.\!\?]/g;
					var sentences = paragraph.match(regexp);
					var senlen = sentences.length;
					for(var i=0;i<senlen;i++) {
						if(sentences[i].includes(text)) {
							require('electron').remote.getGlobal('sharedObject').contextSentence = sentences[i];
						}
					}

					require('electron').remote.getGlobal('sharedObject').selection = text;
					require('electron').remote.getGlobal('sharedObject').cfiRange = cfiRange;
					var docpath = remote.app.getPath('documents');
					var fn = path.join(docpath, 'Jorkens', 'selection.txt');
					fs.writeFile(fn, text, function(err) {
						if(err) {
							return console.log(err);
						} 				
					});
					
					mainProcess.glossarySearch(text);	
					
				}
			});
	}
	
	rendition.on("selected", _.debounce(checkGlossary, 500));
	
    window.addEventListener("unload", function () {
      this.book.destroy();
    });

    book.loaded.navigation.then(function(toc){
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
					// mainProcess.updateConfigChapter(index);
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
	if(require('electron').remote.getGlobal('sharedObject').theme) {
		rendition.themes.select(require('electron').remote.getGlobal('sharedObject').theme);
	} else {
		rendition.themes.select("sepia");
	}
    
    rendition.themes.fontSize("120%");
	
	
			var language = require('electron').remote.getGlobal('sharedObject').language;
			var currentChapter=contents.content.textContent;
			/* var tokenizer = new nlp.WordTokenizer();      Natural tokenizer doesn't work with accented characters!
			var tokens = tokenizer.tokenize(currentChapter); */
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
			
			var docpath = remote.app.getPath('documents');
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
						mainProcess.stanzaLemmatizer();
					} else {
						mainProcess.treeTagger();
					}

				}				
			});
			
			var range, textNode, offset;
			const el2 = rendition.getContents()[0].documentElement;
			//console.log(el2.textContent);
			el2.addEventListener('mousemove', e => {
				// console.log(e.clientX, e.clientY);
				/* range = document.caretRangeFromPoint(e.clientX, e.clientY);
				//console.log(range);
            textNode = range.startContainer;
			//console.log(textNode);
            offset = range.startOffset;
			var data = textNode.data,
            i = offset,
            begin,
            end;
			console.log("data is " + data);
			//Find the begin of the word (space)
        while (i > 0 && data[i] !== " ") { --i; };
        begin = i;

        //Find the end of the word
        i = offset;
        while (i < data.length && data[i] !== " ") { ++i; };
        end = i;
		console.log(begin, end);
        //Return the word under the mouse cursor
        console.log(data.substring(begin, end)); */
			}); 
			
		});
		

	
});

ipcRenderer.on('clear-book', () => {
	book.destroy();
	var divs=document.querySelectorAll("div[id^='epubjs-container']");
	if(divs) {
		divs.forEach(function(div) {
			div.remove();
		});
	}
	var $select = document.getElementById("toc");
	$select.options.length = 0;
	// todo: set lastLocation back to beginning and save
});

const cmenu = new Menu()
// todo: add option to get current selection, search dictionary
cmenu.append(new MenuItem({ label: 'MenuItem1', click() { console.log('item 1 clicked') } }))
cmenu.append(new MenuItem({ type: 'separator' }))
cmenu.append(new MenuItem({ label: 'MenuItem2', type: 'checkbox', checked: true }))

window.addEventListener('contextmenu', (e) => {
  e.preventDefault()
  cmenu.popup({ window: remote.getCurrentWindow() })
}, false);

const makeRangeCfi = (a, b) => {
	// from johnfactotum
    const CFI = new ePub.CFI()
    const start = CFI.parse(a), end = CFI.parse(b)
    const cfi = {
        range: true,
        base: start.base,
        path: {
            steps: [],
            terminal: null
        },
        start: start.path,
        end: end.path
    }
    const len = cfi.start.steps.length
    for (let i = 0; i < len; i++) {
        if (CFI.equalStep(cfi.start.steps[i], cfi.end.steps[i])) {
            if (i == len - 1) {
                // Last step is equal, check terminals
                if (cfi.start.terminal === cfi.end.terminal) {
                    // CFI's are equal
                    cfi.path.steps.push(cfi.start.steps[i])
                    // Not a range
                    cfi.range = false
                }
            } else cfi.path.steps.push(cfi.start.steps[i])
        } else break
    }
    cfi.start.steps = cfi.start.steps.slice(cfi.path.steps.length)
    cfi.end.steps = cfi.end.steps.slice(cfi.path.steps.length)

    return 'epubcfi(' + CFI.segmentString(cfi.base)
        + '!' + CFI.segmentString(cfi.path)
        + ',' + CFI.segmentString(cfi.start)
        + ',' + CFI.segmentString(cfi.end)
        + ')'
}

ipcRenderer.on('get-book-contents', () => {
	var docpath = remote.app.getPath('documents');
	var fn = path.join(docpath, 'Jorkens', 'bookText.txt');
	book.loaded.spine.then((spine) => {
		console.log(spine.length + " spine items");
		spine.each((item) => {
			const thisitem = book.spine.get(item.href);
			thisitem.load(book.load.bind(book)).then(() => {
				const doc=thisitem.document;
				const el = doc.evaluate(
					// '/html/body',
					"//*[name() = 'body']", // the name function avoids the namespace problem
					doc,
					prefix => prefix === 'epub' ? 'http://www.idpf.org/2007/ops' : null,
					XPathResult.ANY_TYPE,
					null
				).iterateNext();
				if(el) {
//					console.log(el);
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
//	console.log("mousetrap");
	Mousetrap.bind(['command+shift+w', 'ctrl+shift+w'], function() {
		mainProcess.createSearchWindow('wf');
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
};

