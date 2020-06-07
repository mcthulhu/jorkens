const { app, BrowserWindow, dialog, globalShortcut, remote, ipcRenderer } = require('electron');
// { process } = require('electron').remote;
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
	console.log("chapter in file-opened is " + chapter);
  if(file.endsWith('epub')) {
	  // console.log("this is an epub"); -- works
  }
  url = file;
  book=ePub(file, { encoding: "binary"});
  book.open(content, "binary");
  
  rendition = book.renderTo("viewer", {
      width: "100%",
      height: 650,
	  spread: "always"
    });

    rendition.display(position);
	 book.ready.then(() => {
		 var booktitle=book.package.metadata.title;
		 var author = book.package.metadata.creator;
		var language=book.package.metadata.language;
		language=language.substring(0, 2);
		document.getElementById("title").textContent=author + " - " + booktitle + " (" + language + ")";
		document.getElementById("toc").selectedIndex = chapter;
		console.log(document.getElementById("toc").selectedIndex + " is selected index");
		require('electron').remote.getGlobal('sharedObject').language=language;
		mainProcess.enableDictionaries();
	   mainProcess.addToRecent(booktitle, url, language);
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

      rendition.on("keyup", keyListener);
      document.addEventListener("keyup", keyListener, false);

    })

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
		$select.selectedIndix = chapter;
      }

    });

    rendition.on("relocated", function(location){
	
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
			//todo: dictionary lookup for text
	});
	
    window.addEventListener("unload", function () {
      console.log("unloading");
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

   
      

  
	

 


  