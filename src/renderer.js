const { app, dialog, globalShortcut, remote, ipcRenderer } = require('electron');
const { BrowserWindow } = require('electron').remote;
const mainProcess = remote.require('./main.js');
const fs = require("fs");
const path = require('path');
const qs = require("querystring");
const { Menu, MenuItem } = remote
const storage = require('electron-json-storage');
const Dialogs = require('dialogs');
const dialogs = Dialogs();
book = ePub();
rendition = null;
lastLocation = null;
url = null;

ipcRenderer.on('start-flashcard-review', (event, data) => {
	fs.writeFileSync(path.join(__dirname, 'flashcard_data.txt'), JSON.stringify(data));
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
	fwin.once('ready-to-show', () => {
		fwin.show();
	});
	fwin.on('closed', () => {
		fwin = null;
    });
});

ipcRenderer.on('got-translation', (event, translation) => {
	dialogs.alert(translation);
});

ipcRenderer.on('get-native-language', (event, oldlanguage) => {
	dialogs.prompt('Enter the digraph for your native language (in lowercase):', oldlanguage, ok => {
      mainProcess.saveNativeLanguage(ok);
    })
});

ipcRenderer.on('get-user-email', (event, oldaddress) => {
	dialogs.prompt('Enter your email address:', oldaddress, ok => {
      mainProcess.saveEmailAddress(ok);
    })
});

ipcRenderer.on('file-opened', (event, file, content, position, chapter) => {
	// console.log("chapter in file-opened is " + chapter);
  if(file.endsWith('epub')) {
	  // console.log("this is an epub"); -- works
  }
  var controls = document.getElementById("controls");
   var currentPage = document.getElementById("current-percent");
   var sliders = document.getElementsByTagName("input");
   if(sliders.length == 1) {
	    var slider = document.createElement("input");
   }
   console.log(sliders);
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
	  spread: "always"
    });

    var displayed = rendition.display(position);
	rendition.on("keyup", keyListener); // not defined??
    document.addEventListener("keyup", keyListener, false);


	 book.ready.then(() => {
		 var booktitle=book.package.metadata.title;
		 var author = book.package.metadata.creator;
		var language=book.package.metadata.language;
		language=language.substring(0, 2);
		document.getElementById("title").textContent=author + " - " + booktitle + " (" + language + ")";
		document.getElementById("toc").selectedIndex = chapter;
		require('electron').remote.getGlobal('sharedObject').language=language;
		mainProcess.enableDictionaries();
	   mainProcess.addToRecent(booktitle, author, url, language);
      
	  
		 var key = book.key()+'-locations';
			var stored = localStorage.getItem(key);
			if (stored && stored.length > 3) {
				// console.log(stored);
				return book.locations.load(stored);			
			} else {
				console.log("generating book locations");
				return book.locations.generate(1024)
			}
	 })
			.then(function(locations){
				require('electron').remote.getGlobal('sharedObject').firstLocation = locations[0];
				//console.log(locations[0]);
				require('electron').remote.getGlobal('sharedObject').lastLocation = locations[locations.length - 1];
				//console.log(locations[locations.length - 1]);
				controls.style.display = "block";
				slider.setAttribute("type", "range");
				slider.setAttribute("min", 0);
				slider.setAttribute("max", 100);
				// slider.setAttribute("max", book.locations.total+1);
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

				// Listen for location changed event, get percentage from CFI
				rendition.on('relocated', function(location){
						var percent = book.locations.percentageFromCfi(location.start.cfi);
						var percentage = Math.floor(percent * 100);
						if(!mouseDown) {
								slider.value = percentage;
						}
						currentPage.value = percentage;
				});

				// Save out the generated locations to JSON
				localStorage.setItem(book.key()+'-locations', book.locations.save());

		});
		/*  book.getRange("epubcfi(/6/14[xchapter_001]!/4/2,/2/2/2[c001s0000]/1:0,/8/2[c001p0003]/1:663)").then(function(range) {
        let text = range.toString()
        console.log(text);
		 }); */
		 

      //});

      

   // })

    var title = document.getElementById("title");

    rendition.on("rendered", function(section){
      var current = book.navigation && book.navigation.get(section.href);
	  
      if (current) {
		  // title.textContent = current.label;
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
		$select.selectedIndex = chapter;
      }

    });

    rendition.on("relocated", function(location){
	 //console.log(location);
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
    });

    rendition.on("layout", function(layout) {
      let viewer = document.getElementById("viewer");

      if (layout.spread) {
        viewer.classList.remove('single');
      } else {
        viewer.classList.add('single');
      }
    });

	rendition.on("selected", (cfiRange, contents) => {
			book.getRange(cfiRange).then((range) => {
                if (range) {
                    let text = range.toString();
					require('electron').remote.getGlobal('sharedObject').selection = text;
					mainProcess.glossarySearch(text);
				}
			});
	});
	
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
					mainProcess.updateConfigChapter(index);
					rendition.display(url);
					return false;
			};

		});
		
		rendition.hooks.content.register(function(contents, view) {
			// console.log(contents);
			// var elements = contents.document.querySelectorAll('[video]');
			// var items = Array.prototype.slice.call(elements);

			// items.forEach(function(item){
		// do something with the video item
		});
		//});
		/* book.loaded.spine.then((spine) => {
			spine.each((item) => {
				item.load().then((contents) => {
					console.log(contents);
				});
			});
		}); */
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
	/* book.loaded.spine.then((spine) => {
		spine.each((item) => {
			item.load().then((contents) => {
				console.log(contents);
			});
		});
	}); */
	const CFI = new ePub.CFI();
	var firstLocation = require('electron').remote.getGlobal('sharedObject').firstLocation;
	console.log(firstLocation);
	var first = CFI.parse(firstLocation).start;
	console.log(first);
	var lastLocation =	require('electron').remote.getGlobal('sharedObject').lastLocation;
	console.log(lastLocation);
	var last = CFI.parse(lastLocation).end;
	console.log(last);
	/* book.getRange(firstLocation).then(function(range) {
		let text=range.toString();
		console.log(text);
	}) */
	book.getRange(makeRangeCfi(first, last)).then(range => {
		console.log(range.toString());
	})
});

   
      

  
	

 


  