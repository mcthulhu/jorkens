const { app, BrowserWindow, Menu, dialog, globalShortcut, shell } = require('electron');
const fs = require("fs");
const path = require('path');
const qs = require("querystring");
const menu = require('./components/menu');
const storage = require('electron-json-storage');
const xml2js = require('xml2js');
 
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

global.sharedObject = {
	native: 'en',
	language: 'eo',
	selection: ''
}


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow, dictWindow;
let book;
let url;
let config = {};

const setNativeLanguage = exports.setNativeLanguage = () => {
	
}

const sqlite3 = require('sqlite3').verbose();
var docpath = app.getPath('documents');
try {
	fs.accessSync(path.join(docpath, 'Jorkens'));
} catch (e) {
	fs.mkdirSync(path.join(docpath, 'Jorkens'));
}
try {
	fs.accessSync(path.join(docpath, 'Jorkens', 'db'));
} catch (e) {
	fs.mkdirSync(path.join(docpath, 'Jorkens', 'db'));
}
try {
	fs.accessSync(path.join(docpath, 'Jorkens', 'Python'));
} catch (e) {
	fs.mkdirSync(path.join(docpath, 'Jorkens', 'Python'));
}
const dbPath = path.join(docpath, 'Jorkens', 'db', 'jorkens.db');

let db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error(err.message);
  } else {
	  console.log('Connected to the jorkens database.');
	  try {
	  db.run('CREATE TABLE IF NOT EXISTS dictionary (lang TEXT, term TEXT, def TEXT, tags TEXT, context TEXT, times INTEGER DEFAULT 1)');
	  db.run('CREATE UNIQUE INDEX IF NOT EXISTS words ON dictionary(lang, term)');
	  db.run('CREATE TABLE IF NOT EXISTS tm (srclang TEXT, tgtlang TEXT, source TEXT, target TEXT, tags TEXT)');
	  db.run('CREATE UNIQUE INDEX IF NOT EXISTS segments ON tm(srclang, source)');
	  db.run('CREATE TABLE IF NOT EXISTS library (title TEXT PRIMARY KEY UNIQUE, author TEXT, location TEXT, tags TEXT, language TEXT, date DATETIME DEFAULT CURRENT_TIMESTAMP)');
	  db.run('CREATE UNIQUE INDEX IF NOT EXISTS recents ON library(location)');
	  db.run('CREATE TABLE IF NOT EXISTS flashcards (term TEXT PRIMARY KEY, def TEXT, deck INTEGER DEFAULT 1, language TEXT, tags TEXT, date DATETIME DEFAULT CURRENT_TIMESTAMP)');
	  db.run('CREATE UNIQUE INDEX IF NOT EXISTS fcindex ON flashcards(term, language)');
	  } catch (e) {
		  console.log(e);
	  }
	 /*  try {
		  db.run('ALTER TABLE library ADD COLUMN author TEXT');
	  } catch (e) {
		  console.log(e);
	  }
	   */
  }
  
});

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
	show: false,
    width: 1000,
    height: 850,
	webPreferences: {
        nodeIntegration: true,
		nativeWindowOpen: true
    }, 
	icon: __dirname + '/book_open.png'
  });
  
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
	mainWindow.once('ready-to-show', () => {
    mainWindow.show();
	//const defaultDataPath = storage.getDefaultDataPath();
	 //console.log("data path is " + defaultDataPath);
	 storage.has('config', function(error, hasKey) {
  if (error) throw error;

  if (hasKey) {
	storage.get('config', function(error, data) {
  if (error) throw error;
  config = data;
	var booklocation = path.normalize(config.lastBook);
	var position = config[booklocation];
  openFile(booklocation, position);
});
  } else {
	  config.lastBook = "";
	  storage.set('config', config);
	  chooseBook();
  }
});
	
	
  });

Menu.setApplicationMenu(menu(mainWindow));
	

  // Open the DevTools.
  mainWindow.webContents.openDevTools();



  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
	db.close();
  });
  //mainWindow.webContents.executeJavaScript('console.log("test");');
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

const createGlossWindow = exports.createGlossWindow = () => {
	var term = global.sharedObject.selection;
	term=term.trim();
	glossWindow = new BrowserWindow({
	show: false,
    width: 600,
    height: 400,
	frame: false,
	webPreferences: {
        nodeIntegration: true
    }
	});
	glossWindow.loadFile(path.join(__dirname, 'gloss.html'));
	
	// glossWindow.webContents.openDevTools();
	glossWindow.once('ready-to-show', () => {
		glossWindow.show();
		glossWindow.webContents.insertText(term);
		glossWindow.webContents.executeJavaScript('document.getElementById("def").focus()');
	});
	glossWindow.on('closed', () => {
		glossWindow = null;
    });
};

const createFlashcardWindow = exports.createFlashcardWindow = () => {
	var term = global.sharedObject.selection;
	term=term.trim();
	flashWindow = new BrowserWindow({
	show: false,
    width: 600,
    height: 400,
	frame: false,
	webPreferences: {
        nodeIntegration: true
    }
	});
	flashWindow.loadFile(path.join(__dirname, 'flash.html'));
	
	// glossWindow.webContents.openDevTools();
	flashWindow.once('ready-to-show', () => {
		flashWindow.show();
		flashWindow.webContents.insertText(term);
		flashWindow.webContents.executeJavaScript('document.getElementById("def").focus()');
		// flashWindow.openDevTools();
	});
	flashWindow.on('closed', () => {
		flashWindow = null;
    });
};


const createSearchWindow = exports.createSearchWindow = (mode) => {
	var language = global.sharedObject.language;
	var native = global.sharedObject.native;
	var term = global.sharedObject.selection;
	term=term.trim();
	
	searchWindow = new BrowserWindow({
		show: false,
		width: 600,
		height: 400,
		webPreferences: {
			nodeIntegration: true
		}
	});
	
	if(mode=='images') {
		var url="https://www.google.com/search?as_epq=" + term + "&as_sitesearch=wikipedia.org&tbm=isch";
	}
	if(mode=='forvo') {
		var url="https://forvo.com/word/" + term + "/#" + language;
	}
	
	if(mode == 'wf') {
		var url="http://www.wordreference.com/" + language + global.sharedObject.native + "/";
		url+=encodeURIComponent(term);
	}
	if(mode == 'wik') {
		var url="https://" + language + ".wiktionary.org/wiki/" + encodeURIComponent(term);
	}
	if(mode == 'gl') {
		var url="https://glosbe.com/" + language + "/" + global.sharedObject.native + "/";
		url += encodeURIComponent(term);
	}
	if(mode == 'deepl') {
		var url="https://www.deepl.com/translator#" + language + "/" + native + "/";
		url += encodeURIComponent(term);
		
	}
	if(mode == 'larousse') {
		var url="https://www.larousse.fr/dictionnaires/francais-anglais/";
		url += encodeURIComponent(term);
	}
	if(mode == 'cdse') {
		var url="https://dizionari.corriere.it/dizionario_inglese/Italiano/";
		var letter = term[0].toUpperCase();
		url += letter + "/" + encodeURIComponent(term) + ".shtml";
	}
	if(mode == 'cdsi') {
		var url="https://dizionari.corriere.it/dizionario_italiano/";
		var letter = term[0].toUpperCase();
		url += letter + "/" + encodeURIComponent(term) + ".shtml";
	}
	if(mode == 'rae') {
		var url="http://dle.rae.es/?w=" + term;
	}
	if(mode == 'vandale') {
		var url="http://www.vandale.nl/opzoeken?pattern=" + term + "&lang=ne";
	}
	if(mode == 'whitaker') {
		var url="http://www.archives.nd.edu/cgi-bin/words.exe?" + term;
	}
	
	if(mode == 'latdict') {
		var url="http://www.latin-dictionary.net/search/latin/" + term;
	}
	
	if(mode == 'dwgs') {
		var url="http://retro.dwds.de/?woerterbuch=1&sh=1&qu=" + term;
	}
	if(mode == 'cnrtl') {
		var url="http://www.cnrtl.fr/definition/" + term;
	}
	if(mode == 'tv5') {
		var url="http://dictionnaire.tv5.org/dictionnaire/definition/" + term;
	}
	if(mode == 'reverso') {
		var url="http://littre.reverso.net/dictionnaire-francais/definition/" + term;
	}
	
	if(mode == 'treccani') {
		var url="http://www.treccani.it/vocabolario/ricerca/" + term + "/";
	}
	if(mode == 'leo') {
		var url="https://dict.leo.org/englisch-deutsch/" + term;
	}
	if(mode == 'dictcc') {
		var url="https://www.dict.cc/?s=" + term;
	}
	if(mode == 'naver') {
		var url="http://endic.naver.com/search.nhn?sLn=en&dicQuery=" + term;
		url+="&x=34&y=12&query=" + term;
		url+="&target=endic&ie=utf8&query_utf=&isOnlyViewEE=N";
	}
	if(mode == 'gramota') {
		var url="http://www.gramota.ru/slovari/dic/?word=" + term + "+&all=x&lop=x&bts=x&zar=x&ag=x&ab=x&sin=x&lv=x&az=x&pe=x";
	}
	if(mode == 'zkorean') {
		var url="https://zkorean.com/dictionary/search_results?word=" + term;
	}
	
	if(mode == 'freed') {
		var url="http://" + language + ".thefreedictionary.com/" + term;
	}
	
	if(mode == 'tatoeba') {
		var url="https://tatoeba.org/eng/sentences/search?query=" + term;
		url+="&from="+ getISOLanguageCodeTrigraph(language) + "&to=eng";
		console.log(url);
	}
	
	if(mode == 'af-glosbe') {
		var url="https://en.glosbe.com/af/en/" + term;
	}
	
	if(mode == 'lexico') {
		var url = "https://www.lexico.com/definition/" + term;
	}
	
	if(mode == 'mwebster') {
		var url = "https://www.merriam-webster.com/dictionary/" + term;
	}
	
	if(mode == 'dexonline') {
		var url = "https://dexonline.ro/definitie/" + term;
	}
	
	if(mode == 'michaelis') {
		var url = "https://michaelis.uol.com.br/moderno-portugues/busca/portugues-brasileiro/" + term + "/";
	}
	
	if(mode== 'cdict.org') {
		var url = "http://www.catalandictionary.org/en/search/"
	}
	
	if(mode == 'ord.se') {
		var url = "https://ne.ord.se/ordbok/svenska/engelska/s%C3%B6k/" + term;
	}
	
	if(mode == 'ling.pl') {
		var url = "https://ling.pl/slownik/polsko-angielski/" + term;
	}
	
	if(mode == 'sl-pons') {
		var url = "https://en.pons.com/translate/slovenian-english/" + term;
	}
	
	if(mode == 'swahili') {
		var url = "https://africanlanguages.com/swahili/";
	}
	
	if(mode == 'td.net') {
		var url = "http://www.turkishdictionary.net/?word=" + term;
	}
	
	if(mode == 'slovnenya') {
		var url = "https://slovnenya.com/dictionary/" + term + "/source/Ukr/target/Eng/interface/Eng";
	}
	
	if(mode == 'rekhta') {
		var url = "https://rekhta.org/urdudictionary/?keyword=" + term;
	}
	
	if(mode == 'vdict') {
		var url = "https://vdict.com/" + term + ",2,0,0.html";
	}
	
	if(mode=='lektorek') {
		var url = "https://lektorek.org/old/polish/";
	}
	
	if(mode == 'yiddishonline') {
		var url = "http://yiddishdictionaryonline.com/";
	}
	
	if(mode == 'geiriadur') {
		var url = "https://geiriadur.uwtsd.ac.uk/index.php?page=ateb&term=" + term;
		url += "&direction=we&type=all&whichpart=exact&submit=Search#ateb_top";
	}
	
	if(mode == 'wsjp') {
		var url = "https://wsjp.pl/index.php?szukaj=" + term + "&pwh=0";
	}
	
	if(mode == 'naob') {
		var url = "https://naob.no/ordbok/" + term;
	}
	
	if(mode == 'seslisozluk') {
		var url = "https://www.seslisozluk.net/" + term + "-nedir-ne-demek/";
	}
	
	if(mode == 'seznam' ){
		var url = "https://slovnik.seznam.cz/preklad/cesky_anglicky/" + term;
	}
	
	if(mode == 'lingea') {
		var url = "https://slovniky.lingea.cz/anglicko-cesky/" + term;
	}
	
	if(mode == 'slovnik.cz') {
		var url = "https://www.slovnik.cz";
	}
	
	if(mode == 'openrussian') {
		var url = "https://en.openrussian.org/";
	}
	
	if(mode == 'gufo') {
		var url = "https://gufo.me/dict/dal/" + term;
	}
	
	if(mode == 'priberam') {
		var url = "https://dicionario.priberam.org/" + term;
	}
	
	if(mode == 'farsi123') {
		var url = "http://farsi123.com/?word=" + term;
	}
	
	if(mode == 'thepashto') {
		var url = "https://thepashto.com/word.php?english=&roman=&pashto="+ term;
	}
	
	if(mode == 'eudict-mk') {
		var url = "https://eudict.com/?lang=maceng&word=" + term;
	}
	
	if(mode == 'teanglann') {
		var url = "https://www.teanglann.ie/en/fgb/" + term;
	}
	
	if(mode == 'kamus') {
		var url = "https://www.kamus.net/indonesia/" + term;
	}
	
	if(mode == 'sztaki') {
		var url = "http://szotar.sztaki.hu/en/search?fromlang=eng&tolang=hun&searchWord=" + term;
		url += "&langprefix=en%2F&searchMode=WORD_PREFIX&viewMode=full&ignoreAccents=0";
	}
	
	if(mode == 'hindi-english') {
		var url = "https://hindi-english.com/hitoen/" + term;
	}
	
	if(mode == 'shabdkosh') {
		var url = "https://www.shabdkosh.com/search-dictionary?lc=hi&sl=en&tl=hi&e=" + term;
	}
	
	if(mode == 'morfix') {
		var url = "https://www.morfix.co.il/en/" + term;
	}
	
	if(mode == 'spanishdict') {
		var url = "https://www.spanishdict.com/translate/" + term;
	}
	
	if(mode == 'sav') {
		var url = "https://slovnik.juls.savba.sk/?w=" + term;
	}
	
	if(mode == 'krstarica') {
		var url = "https://recnik.krstarica.com/e/?text=" + term + "&src=sr&dst=en&do=1";
	}
	
	if(mode == 'freedict-el') {
		var url = "https://el.thefreedictionary.com/" + term;
	}
	
	if(mode == 'translate.ge') {
		var url = "https://www.translate.ge/word/" + term;
	}
	
	if(mode == 'sanakirja') {
		var url = "https://www.suomienglantisanakirja.fi/#/" + term;
	}
	
	if(mode == 'lernu') {
		var url = "https://lernu.net/en/vortaro";
	}
	
	if(mode == 'dictq-eo') {
		var url = "https://dictionaryq.com/esperanto/";
	}
	
	if(mode == 'vortaro') {
		var url = "http://vortaro.net/#" + term;
	}
	
	if(mode == 'lerobert') {
		var url = "https://dictionnaire.lerobert.com/definition/" + term;
	}
	
	if(mode == 'babla') {
		var url = "https://en.bab.la/dictionary/italian-english/" + term;
	}
	
	if(mode == 'beolingus') {
		var url = "https://dict.tu-chemnitz.de/dings.cgi?service=deen&opterrors=0&optpro=0&query=" + term + "&iservice=";
	}
	
	if(mode == 'duden') {
		var url = "https://www.duden.de/suchen/dudenonline/" + term;
	}
	
	if(mode == 'pons-de') {
		var url = "https://de.pons.com/%C3%BCbersetzung/deutsch-englisch/" + term;
	}
	
	if(mode == 'jisho') {
		var url = "https://jisho.org/search/" + term;
	}
	
	if(mode == 'alc.co') {
		var url = "https://eow.alc.co.jp/search?q=" + term + "&ref=sa";
	}
	
	if(mode == 'wwwjdic') {
		var url = "http://nihongo.monash.edu/cgi-bin/wwwjdic?1C";
	}
	
	if(mode == 'dictcn') {
		var url = "https://dict.cn/" + term;
	}
	
	if(mode == 'mdbg') {
		var url = "https://www.mdbg.net/chinese/dictionary?page=worddict&wdrst=0&wdqb=" + term;
	}
	
	if(mode == 'lingueeTM') {
		term=term.replace(/ /g, "+");
		var langname = getFullLanguageName(language);
		var url="http://www.linguee.com/" + langname.toLowerCase() + "-english/translation/" + term + ".html";
		
	}
	
	if(mode == 'glosbeTM') {
		const fetch = require('node-fetch');
		var lang=getISOLanguageCodeTrigraph(language);
		var nat = getISOLanguageCodeTrigraph(native);
		var url="https://glosbe.com/gapi/tm?from=" + lang;
		url += "&dest=" + nat + "&format=json&phrase=" + term + "&page=1&pretty=true";
		console.log(url);
		/* (async () => {
			const response = await fetch(url);
			const json = await response.json();

			console.log(json);
		}); */
	}
	
	if(mode == 'danskeordbog') {
		var url = "https://ordnet.dk/ddo/ordbog?query=" + term;
	}
	
	if(mode == 'rjecnik') {
		var url = "http://rjecnik.net/search.php?search=" + term;
	}
	// https://www.linguee.com/english-italian/search?query=atmosfera
	searchWindow.loadURL(url);
	// searchWindow.webContents.openDevTools();
	searchWindow.once('ready-to-show', () => {
		searchWindow.setMenu(null);
		searchWindow.show();
	});
	searchWindow.on('closed', () => {
		searchWindow = null;
    });
};

function getISOLanguageCodeTrigraph(digraph) {
	var iso = require('iso-639');
	var lang = iso.iso_639_1[digraph]['639-2'];
	return(lang);
}

function getFullLanguageName(digraph) {	
	var iso = require('iso-639');
	var lang = iso.iso_639_1[digraph]['name'];
	return(lang);
}

const chooseBook = exports.chooseBook = () => {
	const files = dialog.showOpenDialogSync(mainWindow, {
		properties: ['openFile'],
		filters: [
		{name: 'Epub books', extensions: ['epub']},
			{name: 'Text files', extensions: ['txt']}
		]
		
	});
	var file = files[0];
	if(config[file]) {
		position = config[file];
	} else {
		position = 0;
	}
	/* if(!config.chapter) {
		config.chapter = 0;
	}
	console.log("config.chapter in choosebook is " + config.chapter); */
	if (files) { openFile(files[0], position) } // removed config.chapter argument
};

const openFile = exports.openFile = (file, position) => { // removed chapter argument
  clearBook();
  const content = fs.readFileSync(file, "binary");
  url = file;
  config.lastBook=file;
  
  /* if(!config.chapter) {
	  config.chapter = 0;
  }
  var chapter = config.chapter; */
  storage.set('config', config);
  mainWindow.webContents.send('file-opened', file, content, position); // removed chapter argument
};

const updateConfigLocation = exports.updateConfigLocation = (file, location) => {
	config[file] = location;
	storage.set('config', config);
};

/* const updateConfigChapter = exports.updateConfigChapter = (chapter) => {
	config.chapter = chapter;
	storage.set('config', config);
}; */

const updateNativeLanguage = exports.updateNativeLanguage = () => {
	if(config.native) {
		var oldlanguage=config.native;
	} else {
		var oldlanguage="en";
	}
	mainWindow.webContents.send('get-native-language', oldlanguage);
}

const updateUserEmail = exports.updateUserEmail = () => {
	if(config.emailAddress) {
		var oldaddress=config.emailAddress;
	} else {
		var oldaddress="joe.smith@gmail.com";
	}
	mainWindow.webContents.send('get-user-email', oldaddress);
}

const saveNativeLanguage = exports.saveNativeLanguage = (newlanguage) => {
	global.sharedObject.native = newlanguage;
	config.native = newlanguage;
	storage.set('config', config);
}

const saveEmailAddress = exports.saveEmailAddress = (newAddress) => {
	config.emailAddress = newAddress;
	storage.set('config', config);
}

const addToRecent = exports.addToRecent = (booktitle, author, file, language) => {
	db.run("INSERT OR REPLACE INTO library(title, author, location, language) VALUES(?,?,?,?)", [booktitle, author, file, language]);
};

const clearBook = exports.clearBook = () => {
	mainWindow.webContents.send('clear-book');	
}

const addToDictionary = exports.addToDictionary = (term, def, lang) => {
	if(term && def && lang) {
		db.run('INSERT OR REPLACE INTO dictionary(lang, term, def) VALUES(?,?,?)', [lang, term, def]);
	}	
	updateDBCounts();
};

const addPairToTM = exports.addPairToTM = () => {
	// 
	updateDBCounts();
}

const addFlashcard = exports.addFlashcard = (term, def, language, tags) => {
	if(term && def && language && tags) {
		db.run("INSERT OR REPLACE INTO flashcards(term, def, language, tags) VALUES(?,?,?,?)", [term, def, language, tags]);
	}
}

const reviewFlashcards = exports.reviewFlashcards = () => {
	var language = global.sharedObject.language;
	var data=[];
	db.each('SELECT * FROM flashcards WHERE language = ?', [language],
		function (err, row) {
			var thisItem = [];
			thisItem.push(row.term);
			thisItem.push(row.def);
			thisItem.push(row.tags);
			data.push(thisItem);
		}, 
		function(err, len) {
			if(err) {
				return console.log(err);
			}
			// console.log(len + " flashcards: " + data);
			
			mainWindow.webContents.send('start-flashcard-review', data);
		}
	);
}



const exportForAnki = exports.exportForAnki = () => {
	var language = global.sharedObject.language;
	const fn = dialog.showSaveDialogSync(mainWindow, {
		filters: [
			{name: 'Flashcard export files', extensions: ['txt']}
		]
		
	});
	var data="";
	db.each('SELECT * FROM flashcards WHERE language = ?', [language],
		function (err, row) {
			data += row.term + "\t" + row.def + "\t" + row.language + row.tags + "\t" + row.date + "\r\n";
		}, 
		function(err, len) {
			if(err) {
				return console.log(err);
			}
			fs.writeFile(fn, data, function(err) {
				if(err) {
					return console.log(err);
				}
				console.log("File saved successfully with " + len + " rows written");
			});
	});	
}

const updateDBCounts = exports.updateDBCounts = () => {
	var language = global.sharedObject.language;
	var glosscount=0;
	var tmcount=0;
	var fccount=0;
	db.get('SELECT count(*) AS cnt FROM tm WHERE srclang = ?', [language],
		function(err, row) {
			if(err) return console.log(err);
			tmcount=row.cnt;
			mainWindow.webContents.send('update-tm-count', tmcount);
		}
	);
	db.get('SELECT count(*) AS cnt FROM dictionary WHERE lang = ?', [language],
		function(err, row) {
			if(err) return console.log(err);
			glosscount=row.cnt;
			mainWindow.webContents.send('update-gloss-count', glosscount);
		}
	);
	db.get('SELECT count(*) AS cnt FROM flashcards WHERE language = ?', [language],
		function(err, row) {
			if(err) return console.log(err);
			fccount=row.cnt;
			mainWindow.webContents.send('update-fc-count', fccount);
		}
	);
	
}

const showLibary = exports.showLibrary = () => {
	var data = "";
	db.each('SELECT * FROM library ORDER BY language, author', [],
		function (err, row) {
			data += row.language + "\t" + row.author + "\t" + row.title + "\t" + row.tags + "\t" +row.location + "\t" + row.date + "\r\n";
		}, 
		function(err, len) {
			if(err) {
				return console.log(err);
			}
			var libwin = new BrowserWindow({
		show: false,
		width: 800,
		height: 600,
		frame: false,
		alwaysOnTop: true,
		webPreferences: {
			nodeIntegration: true
		}
	});
	libwin.loadFile(path.join(__dirname, 'library.html'));
	libwin.webContents.once('did-finish-load', () => {
		libwin.webContents.send('library-data', data);
		console.log('main.js sends libary data ');
	});
	libwin.once('ready-to-show', () => {		
		//libwin.webContents.openDevTools();
		libwin.show();		
	});
	libwin.on('closed', () => {
		libwin = null;
    });
	});
}

const glossarySearch = exports.glossarySearch = (term) => {
	term = term.trim();
	// console.log("searching for " + term + " in glossary");
	var html="<!DOCTYPE html><html><head><title>Glossary search results</title>";
	html+='</head><body><table style="border: solid 1px black; table-layout: fixed; width: 100%;"><thead><tr><th>Term</th><th>Translation</th></tr><tbody>';
	db.each('SELECT * FROM dictionary WHERE lang = ? AND term LIKE ?', [global.sharedObject.language, term+"%"], 
		function (err, row) {
			if(err) console.log(err);
	 else {
				html+="<tr><td style='border: solid 1px black; width:35%'>";
				html+=row.term;
				html+="</td><td style='border: solid 1px black; width:70%'>";
				html+=row.def;
				html+="</td></tr>";
		}
        
	}, function(err, count) {
		if(count == 0) {
			concordance();
			return;
		}
		html+="</tbody></table></body></html>";
		
		var re = new RegExp(term, "g");
		html=html.replace(re, "<span style='background-color:yellow'>" + term + "</span>");
		fs.writeFileSync(path.join(__dirname, 'concordance.html'), html);
		tmWindow = new BrowserWindow({
			show: false,
			width: 600,
			height: 400,
			webPreferences: {
				nodeIntegration: true
			}
		});
		tmWindow.loadFile(path.join(__dirname, 'concordance.html'));
	tmWindow.once('ready-to-show', () => {
		tmWindow.setMenu(null);
		tmWindow.show();
	});
	tmWindow.on('closed', () => {
		tmWindow = null;
    });
	});
}

const concordance = exports.concordance = () => {
		var term = getSelectedText();
		
	if(!term) {
		alert("Nothing highlighted!");
		return;
	}
	//console.log("searching for " + term + " in memory");
	var html="<!DOCTYPE html><html><head><title>Concordance search results</title>";
	html+='</head><body><table style="border: solid 1px 	black"; table-layout: fixed; width: 100%;><thead><tr><th>Source</th><th>Translation</th></tr><tbody>';
    db.each('SELECT * FROM tm WHERE srclang = ? AND source LIKE ?', [global.sharedObject.language, "%"+term+"%"], 
		function (err, row) {
			if(err) console.log(err);
	 else {
				html+="<tr><td style='border: solid 1px black'>";
				html+=row.source;
				html+="</td><td style='border: solid 1px black'>";
				html+=row.target;
				html+="</td></tr>";
		}
        
	}, function(err, count) {
		if(count == 0) {
			return;
		}
		html+="</tbody></table></body></html>";
		
		var re = new RegExp(term, "g");
		html=html.replace(re, "<span style='background-color:yellow'>" + term + "</span>");
		fs.writeFileSync(path.join(__dirname, 'concordance.html'), html);
		tmWindow = new BrowserWindow({
			show: false,
			width: 600,
			height: 400,
			webPreferences: {
				nodeIntegration: true
			}
		});
		tmWindow.loadFile(path.join(__dirname, 'concordance.html'));
	tmWindow.once('ready-to-show', () => {
		tmWindow.setMenu(null);
		tmWindow.show();
	});
	tmWindow.on('closed', () => {
		tmWindow = null;
    });
	});
}

const importDictionary = exports.importDictionary = () => {
	const files = dialog.showOpenDialogSync(mainWindow, {
		properties: ['openFile'],
		filters: [
			{name: 'Text files', extensions: ['txt']}
		]
		
	});
	
	if (files) { var fn = files[0] }
	fs.readFile(fn, "utf8", (err,data) => {
		if(err) throw err;
		var lines=data.split("\r\n");
		var len=lines.length;
		db.run("BEGIN TRANSACTION");
		for(var i=0;i<len;i++) {
			var pieces=lines[i].split("\t");
			if(!pieces[2]) {
				pieces[2] = global.sharedObject.language;
			}
			db.run("INSERT OR REPLACE INTO dictionary(lang, term, def) VALUES(?,?,?)", [pieces[2], pieces[0], pieces[1]]);
		}
		db.run("COMMIT");
	});
}

const enableDictionaries = exports.enableDictionaries = () => {
	var language = global.sharedObject.language;
	// console.log(language);
	var myMenu=Menu.getApplicationMenu();	
	myMenu.items[3].submenu.getMenuItemById(language).visible = true;
	myMenu.items[8].submenu.items[0].visible = false;
	
}

const importTM = exports.importTM = () => {
	var DOMParser = require('xmldom').DOMParser;
	var language = global.sharedObject.language;
	var native= global.sharedObject.native;
	const files = dialog.showOpenDialogSync(mainWindow, {
		properties: ['openFile'],
		filters: [
			{name: 'Translation memory files', extensions: ['tmx']}
		]
		
	});
	if (files) { var fn = files[0] }
	fs.readFile(fn, "utf8", (err,data) => {
		if(err) throw err;
		var doc = new DOMParser().parseFromString(data, 'text/xml');
		var tus=doc.getElementsByTagName('tu');
		var tulen=tus.length;
		console.log(tulen + " tus");
		
		db.run("BEGIN TRANSACTION");
		for(var i=0;i<tulen;i++) {
			var tuvs=tus[i].getElementsByTagName("tuv");
			var src=tuvs[0].getElementsByTagName("seg")[0].textContent;
			var tgt=tuvs[1].getElementsByTagName("seg")[0].textContent;
			db.run("INSERT OR REPLACE INTO tm(srclang, tgtlang, source, target) VALUES(?,?,?,?)", [language, native, src, tgt]);
		}	
		db.run("COMMIT");
	});
	updateDBCounts();
}

const exportDictionary = exports.exportDictionary = () => {
	const fn = dialog.showSaveDialogSync(mainWindow, {
		filters: [
			{name: 'Dictionary export files', extensions: ['txt']}
		]
		
	});
	var data="";
    db.each('SELECT * FROM dictionary WHERE rowid IN (SELECT MAX(rowid) FROM dictionary GROUP BY term)', 
		function (err, row) {
			data += row.term + "\t" + row.def + "\t" + row.lang + "\r\n";
		}, 
		function(err, len) {
			if(err) {
				return console.log(err);
			}
			fs.writeFile(fn, data, function(err) {
				if(err) {
					return console.log(err);
				}
				console.log("File saved successfully with " + len + " rows written");
			});
	});	
	
}

const getSelectedText = exports.getSelectedText = () => {
	var txt = global.sharedObject.selection;
	return(txt);
}
   
const playPolly = exports.playPolly = () => {
	var words=getSelectedText();
	if(words.length > 1500) {
		words=words.substring(0, 1500);
		new Notification("text has been truncated to 1500 characters");
	}
	var language = global.sharedObject.language;
	switch(language) {
		case "en": {
			var voice="Amy";
			break;
		}
		case "da": {
			var voice="Naja";
			break;
		}
		case "nl": {
			var voice="Lotte";
			break;
		}
		case "fr": {
			var voice="Celine";
			break;
		}
		case "de": {
			var voice="Marlene";
			break;
		}
		case "is": {
			var voice="Dora";
			break;
		}
		case "it": {
			var voice="Carla";
			break;
		}
		case "ja": {
			var voice="Mizuki";
			break;
		}
		case "no": {
			var voice="Liv";
			break;
		}
		case "pl": {
			var voice="Ewa";
			break;
		}
		case "pt": {
			var voice="Vitoria";
			break;
		}
		case "ro": {
			var voice="Carmen";
			break;
		}
		case "ru": {
			var voice="Tatyana";
			break;
		}
		case "sp": {
			var voice="Penelope";
			break;
		}
		case "sv": {
			var voice="Astrid";
			break;
		}
		case "tr": {
			var voice="Filiz";
			break;
		}
		default: {
			var voice="Joanna";
		}
	}
	var AWS=require('aws-sdk');
	var polly=new AWS.Polly({region: 'us-east-1'});
	
	params = {
		OutputFormat: "mp3", 
		SampleRate: "8000", 
		Text: words, 
		TextType: "text", 
		VoiceId: voice
	};
	polly.synthesizeSpeech(params, function(err, data) {
		if (err) console.log(err, err.stack); // an error occurred
		else  {
			var fs=require('fs');
			var output= path.join(app.getPath('appData'), "speech.mp3");
			var wstream = fs.createWriteStream(output);
			wstream.write(data.AudioStream);
			wstream.end();
			shell.openItem(output);	
		}   
	});
}

const amazonTranslate = exports.amazonTranslate = () => {
	var words=getSelectedText();
	if(words.length > 1500) {
		words=words.substring(0, 1500);
		new Notification("text has been truncated to 1500 characters");
	}
	var language = global.sharedObject.language;
	var AWS=require('aws-sdk');
	var params = {
		"SourceLanguageCode": global.sharedObject.language,
		"TargetLanguageCode": global.sharedObject.native,
		"Text": words
	}
	var translate=new AWS.Translate({region: 'us-east-1'});
	translate.translateText(params, function(err, data) {
		if (err) console.log(err, err.stack); // an error occurred
		else  {
			mainWindow.webContents.send('got-translation', data.TranslatedText);	
		}   
	});
}

const googleTranslate = exports.googleTranslate = () => {
	var text=getSelectedText();
	var target = global.sharedObject.native;
	// following code is from https://cloud.google.com/translate/docs/basic/translating-text#translate_translate_text-nodejs
	const {Translate} = require('@google-cloud/translate').v2;
	const translate = new Translate();
	async function translateText() {
		let [translations] = await translate.translate(text, target);
		translations = Array.isArray(translations) ? translations : [translations];
		console.log('Translations:');
		translations.forEach((translation, i) => {
			console.log(`${text[i]} => (${target}) ${translation}`);
		});
		mainWindow.webContents.send('got-translation', translations);
	}
	translateText();
}

const myMemory = exports.myMemory = () => {
	
}

const getBookContents = exports.getBookContents = () => {
	mainWindow.webContents.send('get-book-contents');	
}

const WindowsTTS = exports.WindowsTTS = () => {
	var words=getSelectedText();
	var language = global.sharedObject.language;
	ssWindow = new BrowserWindow({
		show: false,
		width: 600,
		height: 400,
		webPreferences: {
			nodeIntegration: true
		}
	});
	ssWindow.loadURL(path.join(__dirname, 'speech-synthesis.html'));
	// ssWindow.webContents.openDevTools();
	ssWindow.webContents.on('did-finish-load', () => {
		ssWindow.webContents.send('language', language);
		ssWindow.webContents.send('tts-data', words);
	});
	ssWindow.once('ready-to-show', () => {
		ssWindow.setMenu(null);
		ssWindow.show();
	});
	ssWindow.on('closed', () => {
		ssWindow = null;
    });
	
}