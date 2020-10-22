const { app, BrowserWindow, Menu, MenuItem, dialog, globalShortcut, shell } = require('electron');
const fs = require("fs");
const path = require('path');
const os =  require('os');
const qs = require("querystring");
const menu = require('./components/menu.js');
const storage = require('electron-json-storage');
const xml2js = require('xml2js');
const _ = require('underscore');
const {PythonShell} = require('python-shell');
const home = app.getPath('home');
const nlp = require('natural') ;

var lemmas = [];
var unknowns = [];
var title;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}



global.sharedObject = {
	native: 'en',
	language: 'eo',
	theme: 'sepia',
	selection: '',
	booktitle: '',
	booklocation: '',
	lastLocation: [],
	cfiRange: '', 
	contextSentence: ''
}


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow, dictWindow;
let book;
let url;
let config = {};

const setNativeLanguage = exports.setNativeLanguage = () => {
	
}

const sqlite3 = require('sqlite3');
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
var exists = fs.existsSync(dbPath);

let db = new sqlite3.Database(dbPath, createTables); 

function createTables() {
		db.serialize(()  => {
		db.run('CREATE TABLE IF NOT EXISTS dictionary (lang TEXT, term TEXT, def TEXT, tags TEXT, context TEXT, times INTEGER DEFAULT 1)');	  
		db.run('CREATE TABLE IF NOT EXISTS tm (srclang TEXT, tgtlang TEXT, source TEXT, target TEXT, tags TEXT)');	  
		db.run('CREATE TABLE IF NOT EXISTS library (title TEXT PRIMARY KEY UNIQUE, author TEXT, location TEXT, tags TEXT, language TEXT, date DATETIME DEFAULT CURRENT_TIMESTAMP)');	  
		db.run('CREATE TABLE IF NOT EXISTS flashcards (term TEXT PRIMARY KEY, def TEXT, deck INTEGER DEFAULT 1, language TEXT, tags TEXT, date DATETIME DEFAULT CURRENT_TIMESTAMP)');	
		db.run('CREATE TABLE IF NOT EXISTS locations (title TEXT PRIMARY KEY UNIQUE, locations TEXT, current_location TEXT)');
		db.run('CREATE TABLE IF NOT EXISTS passages (title TEXT, passage TEXT, cfiRange TEXT, type TEXT, notes TEXT, style TEXT, tags TEXT, date DATETIME DEFAULT CURRENT_TIMESTAMP)');
		 db.run('CREATE UNIQUE INDEX IF NOT EXISTS words ON dictionary(lang, term)');
		 db.run('CREATE UNIQUE INDEX IF NOT EXISTS segments ON tm(srclang, source)');
		 db.run('CREATE UNIQUE INDEX IF NOT EXISTS recents ON library(location)');
		 db.run('CREATE UNIQUE INDEX IF NOT EXISTS fcindex ON flashcards(term, language)');	
		 db.all("PRAGMA table_info('library')", (err, rows) => {
			 if (err) throw err;
			 if(JSON.stringify(rows).indexOf('secret') < 0) {
				 db.run('ALTER TABLE library ADD COLUMN secret INTEGER DEFAULT 0');
			 }
		 });
		 db.all("PRAGMA table_info('flashcards')", (err, rows) => {
			 if (err) throw err;
			 if(JSON.stringify(rows).indexOf('context') < 0) {
				 db.run('ALTER TABLE flashcards ADD COLUMN context TEXT');
			 }
		 });
		 
		// console.log("created database tables");
	});
  
	
	  
	 /*  try {
		  db.run('ALTER TABLE library ADD COLUMN author TEXT');
	  } catch (e) {
		  console.log(e);
	  }
	   */
	   
  }
  
  
//});

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
	show: false,
    width: 1000,
    height: 850,
	webPreferences: {
        nodeIntegration: true,
		nativeWindowOpen: true,
		enableRemoteModule: true
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
	global.sharedObject.booklocation = booklocation; 
	var position = config[booklocation];
	if(config.theme) {
		global.sharedObject.theme = config.theme;
	}
	
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
  // mainWindow.webContents.openDevTools();

mainWindow.on('close', () => {
	saveCurrentLocation(global.sharedObject.booktitle, global.sharedObject.lastLocation);
});
  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
	
    mainWindow = null;
	// console.log(JSON.stringify(config));
	
	db.close();
	var docpath = app.getPath('documents');
	try {
		var fn = path.join(docpath, 'Jorkens', 'bookText.txt');
		fs.unlinkSync(fn);
	} catch(e) {
		console.log(e);
	}
	
	fn = path.join(docpath, 'Jorkens', 'currentChapter.txt');
	fs.unlinkSync(fn);
	fn = path.join(docpath, 'Jorkens', 'tokens.txt');
	fs.unlinkSync(fn);
	
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
	
	// delete temporary data files here?
	
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

const saveUnknowns = exports.saveUnknowns = () => {
	const fn = dialog.showSaveDialogSync(mainWindow, {
		filters: [
			{name: 'Text files', extensions: ['txt']}
		]
		
	});
	var data = unknowns.join('\r\n');
	fs.writeFile(fn, data, function(err) {
		if(err) {
			return console.log(err);
		}
	});
}

const createGlossWindow = exports.createGlossWindow = () => {
	// if(glossWindow) return;
	var term = global.sharedObject.selection;
	term=term.trim().toLowerCase();
	if(lemmas[term]) {
		term = lemmas[term];
	}
	// console.log("createglosswindow: " + term);
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

const createAnnotationWindow = exports.createAnnotationWindow = () => {
	// if(glossWindow) return;
	var  passage = global.sharedObject.selection;
	passage=passage.trim();
	annotationWindow = new BrowserWindow({
	show: false,
    width: 600,
    height: 400,
	frame: false,
	webPreferences: {
        nodeIntegration: true
    }
	});
	annotationWindow.loadFile(path.join(__dirname, 'annotation.html'));
	
	// annotationWindow.webContents.openDevTools();
	annotationWindow.once('ready-to-show', () => {
		annotationWindow.show();
		annotationWindow.webContents.insertText(passage);
		annotationWindow.webContents.executeJavaScript('document.getElementById("notes").focus()');
	});
	annotationWindow.on('closed', () => {
		annotationWindow = null;
    });
};

const createTMWindow = exports.createTMWindow = () => {
	var source = global.sharedObject.selection;
	source=source.trim();
	tmWindow = new BrowserWindow({
		show: false,
		width: 600,
		height: 400,
		frame: false,
		webPreferences: {
        nodeIntegration: true
    }
	});
	tmWindow.loadFile(path.join(__dirname, 'tm_add.html'));
	
	// tmWindow.webContents.openDevTools();
	tmWindow.once('ready-to-show', () => {
		tmWindow.show();
		tmWindow.webContents.insertText(source);
		tmWindow.webContents.executeJavaScript('document.getElementById("target").focus()');
	});
	tmWindow.on('closed', () => {
		tmWindow = null;
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
	
	if(mode == 'google-translate') {
		//var url = "https://translate.google.pn/translate_a/t?client=dict-chrome-ex&sl=auto&tl=" + native + "&q=" + term + "&ie=UTF-8&oe=UTF-8";
		var url = "https://translate.google.pn/#view=home&op=translate&sl=auto&tl=" + native + "&text=" + term; 
	}
	
	if(mode == 'verbix') {
		var fullLang = getFullLanguageName(language);
		fullLang.charAt(0).toUpperCase();
		if(lemmas[term]) {
			term = lemmas[term];
		}
		var url = "https://verbix.com/webverbix/" + fullLang + "/" + term + ".html";
	}
	
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
	if(mode == 'milog') {
		var url = "https://milog.co.il/" + term;
	}
	if(mode == 'daum') {
		var url = "https://dic.daum.net/search.do?q=" + term + "&dic=" + getISOLanguageCodeTrigraph(native);
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
	
	if(mode=='yellowbridge') {
		var url = "https://www.yellowbridge.com/chinese/dictionary.php?word=" + term;
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

const stanzaLemmatizer = exports.stanzaLemmatizer = () => {
	var language = global.sharedObject.language;
	console.log("running stanza lemmatizer for " + language);
	var output = [];
	var pythonScriptPath = path.join(docpath, 'Jorkens', 'Python');
	if(process.platform == 'win32') {
		var myPythonPath = path.join('C:', 'Python38', 'python.exe');
	} else if(process.platform == 'linux') {
		var myPythonPath = '/usr/bin/python3';
	}

	let options = {
		mode: 'text',
		pythonPath: myPythonPath,
		pythonOptions: ['-u'], // get print results in real-time
		scriptPath: pythonScriptPath,
		args: [language]
	};
	
	let pyshell = new PythonShell('stanza-lemmatizer.py', options);
	pyshell.on('message', function (message) {
		output.push(message);
	});
	pyshell.end(function (err) {
		if (err) throw err;
		processStanza(output);
	});	
}

const processStanza = exports.processStanza = (results) => {
	var len = results.length;
	for(var i = 0; i<len; i++) {
		var pieces = results[i].split('\t');
		lemmas[pieces[0] = pieces[1]];
	}
}
     
const treeTagger = exports.treeTagger = () => {
	lemmas = [];
	var language = global.sharedObject.language;
	var lang = getFullLanguageName(language).toLowerCase();
	var input = path.join(docpath, "Jorkens", "tokens.txt");
	var child = require('child_process').execFile;
	if(process.platform == 'win32') {
		var executablePath = "C:\\TreeTagger\\bin\\tree-tagger.exe";
		var parameters = ["C:\\TreeTagger\\lib\\" + lang + ".par", input, "-token", "-lemma", "-no-unknown"];
	} else if(process.platform == 'linux') {
		const os = require('os');
		var home = os.homedir();
		var executablePath = path.join(home, "TreeTagger", "bin", "tree-tagger");
		var parameters = [path.join(home, "TreeTagger", "lib", lang + ".par"), input, "-token", "-lemma", "-no-unknown"];
	}
	
	
	child(executablePath, parameters, function(err, data) {
		console.log(err);
		var lines = data.trim().split(/[\r\n]+/);
		for (var i = 0; i < lines.length; i++) {
			var line = lines[i];
			var items = line.split('\t');
			lemmas[items[0]] = items[2];
		}
		// console.log(lemmas);
	});
	stanzaLemmatizer();
}

const chooseBook = exports.chooseBook = () => {
	const files = dialog.showOpenDialogSync(mainWindow, {
		properties: ['openFile'],
		filters: [
			{name: 'Epub books', extensions: ['epub']},
			{name: 'Text files', extensions: ['txt']},
			{name: 'Mobipocket books', extensions: ['mobi']},
			{name: 'Kindle books', extensions: ['azw3', 'azw']},
			{name: 'PDF files', extensions: ['pdf']},
			{name: 'Microsoft Reader books', extensions: ['lit']},
			{name: 'Sony ebooks', extensions: ['lrf']},
			{name: 'Microsoft Word files', extensions: ['docx', 'doc']},
			{name: 'Palm ebooks', extensions: ['pdb']},
			{name: 'FictionBook ebooks', extensions: ['fb2']},
			{name: 'RTF files', extensions: ['rtf']}
		]
		
	});
	var file = files[0];
	if(path.extname(file) != '.epub') {
		convertToEpub(file);
		return;
	}
	global.sharedObject.booklocation = file;
	// search of locations table goes here
	if(config[file]) {
		position = config[file];
	} else {
		position = 0;
	}

	if (files) { openFile(files[0], position) } // removed config.chapter argument
};

const openFile = exports.openFile = (file, position) => { // removed chapter argument
  clearBook();
  const content = fs.readFileSync(file, "binary");
  url = file;
  global.sharedObject.booklocation = file;
  config.lastBook=file;
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

const updateForeignLanguage = exports.updateForeignLanguage = () => {
	if(config.language) {
		var oldlanguage=config.language;
	} else {
		var oldlanguage="eo";
	}
	mainWindow.webContents.send('get-foreign-language', oldlanguage);
}

const updateUserEmail = exports.updateUserEmail = () => {
	if(config.emailAddress) {
		var oldaddress=config.emailAddress;
	} else {
		var oldaddress="joe.smith@gmail.com";
	}
	mainWindow.webContents.send('get-user-email', oldaddress);
}

const getSearchTerm = exports.getSearchTerm = () => {
	mainWindow.webContents.send('get-search-term');
}


const saveNativeLanguage = exports.saveNativeLanguage = (newlanguage) => {
	global.sharedObject.native = newlanguage;
	config.native = newlanguage;
	storage.set('config', config);
}

const saveForeignLanguage = exports.saveForeignLanguage = (newlanguage) => {
	global.sharedObject.language = newlanguage;
	console.log("global language setting is " + global.sharedObject.language);
	config.language = newlanguage;
	storage.set('config', config);
}


const saveEmailAddress = exports.saveEmailAddress = (newAddress) => {
	config.emailAddress = newAddress;
	storage.set('config', config);
}

const addToRecent = exports.addToRecent = (booktitle, author, file, language) => {
	db.run("INSERT OR IGNORE INTO library(title, author, location, language) VALUES(?,?,?,?)", [booktitle, author, file, language]);
};

const saveLocations = exports.saveLocations = (title, locations) => {
	db.run("INSERT OR IGNORE INTO locations(title, locations) VALUES(?,?)", [title, locations]);

}

const saveCurrentLocation = exports.saveCurrentLocation = (title, current_location) => {
	db.run('UPDATE locations SET current_location = ? WHERE TITLE = ?', [current_location, title], 
		function(err) {
			console.log(err);
		});
} 

const clearBook = exports.clearBook = () => {
	global.sharedObject.booklocation = "";
	mainWindow.webContents.send('clear-book');	
}

const addToDictionary = exports.addToDictionary = (term, def, context, lang, addflashcard) => {
	if(term && def && lang) {
		db.run('INSERT OR REPLACE INTO dictionary(lang, term, def, context) VALUES(?,?,?,?)', [lang, term, def, context]);
	}	
	if(addflashcard == true) {
		var tags = '';
		addFlashcard(term, def, context, lang, tags);
	}
	updateDBCounts();
};

const addToPassages = exports.addToPassages = (passage, notes) => {
	var cfiRange = global.sharedObject.cfiRange;
	var title = global.sharedObject.booktitle;
	if(passage) {		
		db.run('INSERT OR REPLACE INTO passages(title, passage, cfiRange, notes) VALUES(?,?,?,?)', [title, passage, cfiRange, notes]);
	}	
	mainWindow.webContents.send('apply-highlight', title, passage, cfiRange, notes);
};

const applyPassages = exports.applyPassages = () => {
	var title = global.sharedObject.booktitle;
	db.each('SELECT * FROM passages WHERE title = ?', [title],
		function (err, row) {
			mainWindow.webContents.send('apply-highlight', row.title, row.passage, row.cfiRange, row.notes);
		}, 
		function(err, len) {
			if(err) {
				return console.log(err);
			}
			console.log(len + " passages found");
		}
	);
	
}

const addPairToTM = exports.addPairToTM = (source, target, srclang) => {
	var tgtlang = global.sharedObject.native;
	if(source && target && srclang) {
		db.run('INSERT OR REPLACE INTO tm(srclang, tgtlang, source, target) VALUES(?,?,?,?)', [srclang, tgtlang, source, target]);
	}	
	updateDBCounts(); 
}

const addFlashcard = exports.addFlashcard = (term, def, context, language, tags) => {
	// console.log(term, def, context, language, tags);
	//if(term && def && language && tags) {
		db.run("INSERT OR REPLACE INTO flashcards(term, def, context, language, tags) VALUES(?,?,?,?,?)", [term, def, context, language, tags]);
	//}
	updateDBCounts();
}

const reviewFlashcards = exports.reviewFlashcards = () => {
	var language = global.sharedObject.language;
	var data=[];
	db.each('SELECT * FROM flashcards WHERE language = ?', [language],
		function (err, row) {
			var thisItem = [];
			thisItem.push(row.term);
			thisItem.push(row.def);
			thisItem.push(row.context);
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

const addToSecretShelf = exports.addToSecretShelf = () => {
	db.run('UPDATE library SET secret = 1 WHERE location = ?', [global.sharedObject.booklocation], function(error, row) {
		if(error) {
			console.log(error);
		}
	});
	console.log("set to secret");
}

const displaySearchResults = exports.displaySearchResults = (results) => {
	// console.log(results);
	var searchresultswin = new BrowserWindow({
		show: false,
		width: 800,
		height: 600,
		frame: false,
		alwaysOnTop: true,
		webPreferences: {
			nodeIntegration: true,
			enableRemoteModule: true
		}
	});
	searchresultswin.movable = true;
	searchresultswin.loadFile(path.join(__dirname, 'searchresults.html'));
	searchresultswin.webContents.once('did-finish-load', () => {
		searchresultswin.webContents.send('search-results-data', results);
	});
	searchresultswin.once('ready-to-show', () => {		
		//searchresultswin.webContents.openDevTools();
		searchresultswin.show();		
	});
	searchresultswin.on('closed', () => {
		searchresultswin = null;
    });
}

const showLibary = exports.showLibrary = () => {
	var data = "";
	db.each('SELECT * FROM library ORDER BY language, author', [],
		function (err, row) {
			data += row.language + "\t" + row.author + "\t" + row.title + "\t" + row.tags + "\t" +row.location + "\t" + row.date + "\t" + row.secret + "\r\n";
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

function normalizeSpelling(s, language) {
	if(language == 'fa') {
		s=s.replace(/\u064A/g, '\u06CC'); // change Arabic ye to Farsi ye
	}
	return(s);
}

const glossarySearch = exports.glossarySearch = (term) => {
	var language = global.sharedObject.language;
	term = term.trim().toLowerCase();
	term = normalizeSpelling(term, language);
	unknowns.push(term + "\t" + global.sharedObject.contextSentence);
	if(lemmas[term]) {
		var oldterm = term;
		term = lemmas[term];
	}
	
	
	var html="<!DOCTYPE html><html><head><title>Glossary search results</title>";
	html+='</head><body><table style="border: solid 1px black; table-layout: fixed; width: 100%;"><thead><tr><th>Term</th><th>Translation</th></tr><tbody>';
	db.each('SELECT * FROM dictionary WHERE lang = ? AND term LIKE ? or term = ?', [global.sharedObject.language, term+"%", oldterm], 
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
	var html="<!DOCTYPE html><html><head><title>Concordance search results</title>";
	html+='</head><body><table style="border: solid 1px 	black"; table-layout: fixed; width: 100%;><thead><tr><th>Source</th><th>Translation</th></tr><tbody>';
    db.each('SELECT * FROM tm WHERE srclang = ? AND source LIKE ? LIMIT 100', [global.sharedObject.language, "% "+term+"%"], 
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

const RAKE = exports.RAKE = () => {
	const rakejs = require('@shopping24/rake-js');
	const sw = require('stopword');
	var language = global.sharedObject.language;
	var myStopwords = eval(`sw.${language}`);
	const opts = {stopwords: myStopwords};
	
	var docpath = app.getPath('documents');
	var fn = path.join(docpath, 'Jorkens', 'currentChapter.txt');
	var booktext = fs.readFileSync(fn, {encoding:'utf8', flag:'r'});
	booktext = booktext.replace(/\s+/g, ' ');
	const { result } = rakejs.extract(booktext)
.setOptions({ stopWords: myStopwords })
.pipe(rakejs.extractKeyPhrases)
// .pipe(rakejs.extractAdjoinedKeyPhrases)
.pipe(rakejs.keywordLengthFilter)
.pipe(rakejs.distinct)
.pipe(rakejs.scoreWordFrequency)
.pipe(rakejs.sortByScore);

console.log(result);
}

function getInputFile() {
	const files = dialog.showOpenDialogSync(mainWindow, {
		properties: ['openFile'],
		filters: [
			{name: 'Text files', extensions: ['txt']}
		]
		
	});
	
	if (files) { var fn = files[0] }
	return(fn);
}

const wordNetLookup = exports.wordNetLookup = () => {
	var output = [];
	var txt = getSelectedText();
	if(!txt) { return }
	var WordPOS = require('wordpos'),
    wordpos = new WordPOS({stopwords: true}); // stopwords not working here
	var words = wordpos.parse(txt);
	var sw = require('stopword');
	var filter = sw.en;
	words = sw.removeStopwords(words, filter);
	words = words.filter(function(e){return e}); // remove empty elements
	console.log(words);
	var len = words.length;
	for(var i = 0; i<len; i++) {
		wordpos.lookup(words[i],  function(result) {
			var rlen = result.length;
			for(var j=0;j<rlen;j++) {
				//if(words.includes(result[j].lemma)) {
					output.push(result[j].lemma + " = " + result[j].def);
				//}				
			}
			if(i === len) {
				console.log(output);
				if(output.length > 0) {
					mainWindow.webContents.send('got-translation', output.join('\r\n'));
				}
				
			}
		});
	}	
	
}


const importFacebookMUSEDictionary = exports.importFacebookMUSEDictionary = () => {
	var lang = global.sharedObject.language;
	var fn = getInputFile();
	var entries = {};
	
	fs.readFile(fn, "utf8", (err,data) => {
		if(err) throw err;
		var lines=data.split(/[\r\n]+/);
		var len=lines.length;
		//console.log(len);
		for(var i=0;i<len;i++) {
			console.log(lines[i]);
			if(lines[i] && lines[i].length > 2)  {
				var pieces=lines[i].split(" ");
				//console.log(pieces);
			//console.log("working on " + pieces[0]);
			if(pieces[0] != pieces[1]) {
				if(pieces[0].length > 0 && !entries[pieces[0]]) {
					entries[pieces[0]] = [];
				} 
				if(pieces[1].length > 0 && Array.isArray(entries[pieces[0]])) { entries[pieces[0]].push(pieces[1]); }
					//console.log(pieces[0] + " = " + entries[pieces[0]]);
			}
			
			}
			
		}
		//console.log(entries);
		var elen= Object.keys(entries).length;
		console.log(elen + " entries found");
		db.run("BEGIN TRANSACTION");
		for(var term in entries) {
			db.run("INSERT OR REPLACE INTO dictionary(lang, term, def) VALUES(?,?,?)", lang,  term, entries[term].join(", "));
		}
		db.run("COMMIT");
		updateDBCounts();
	});
	
	
}

const importDictionary = exports.importDictionary = () => {
	var fn = getInputFile();
	fs.readFile(fn, "utf8", (err,data) => {
		if(err) throw err;
		var lines=data.split(/[\r\n]+/);
		var len=lines.length;
		console.log(len + " entries found");
		db.run("BEGIN TRANSACTION");
		for(var i=0;i<len;i++) {
			var pieces=lines[i].split("\t");
			if(!pieces[2] || pieces[2].length != 2) {
				pieces[2] = global.sharedObject.language;
			}
			db.run("INSERT OR REPLACE INTO dictionary(lang, term, def) VALUES(?,?,?)", [pieces[2], pieces[0], pieces[1]]);
		}
		db.run("COMMIT");
		updateDBCounts();
	});
	
}

const enableDictionaries = exports.enableDictionaries = () => {
	var language = global.sharedObject.language;
	// console.log(language);
	var myMenu=Menu.getApplicationMenu();	
	myMenu.items[3].submenu.getMenuItemById(language).visible = true;
	// myMenu.items[8].submenu.items[0].visible = false;
	
}

const importTM = exports.importTM = () => {
	var DOMParser = require('xmldom').DOMParser;
	var flag=0;
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
			if(tuvs[0].getAttribute("xml:lang") == language && tuvs[1].getAttribute("xml:lang") == native) {
				// console.log("first tuv has lang " + tuvs[0].getAttribute("xml:lang"));
				var src=tuvs[0].getElementsByTagName("seg")[0].textContent;
				var tgt=tuvs[1].getElementsByTagName("seg")[0].textContent;
				flag=1;
			} else if(tuvs[1].getAttribute("xml:lang") == language && tuvs[0].getAttribute("xml:lang") == native) {
				
					// console.log("second tuv has lang " + tuvs[1].getAttribute("xml:lang"));
				var src=tuvs[1].getElementsByTagName("seg")[0].textContent;
				var tgt=tuvs[0].getElementsByTagName("seg")[0].textContent;
				flag=1;
			} else if(flag==0) {
				var src=tuvs[0].getElementsByTagName("seg")[0].textContent;
				var tgt=tuvs[1].getElementsByTagName("seg")[0].textContent;
			}
					
			db.run("INSERT OR REPLACE INTO tm(srclang, tgtlang, source, target) VALUES(?,?,?,?)", [language, native, src, tgt]);
		}	
		db.run("COMMIT");
		updateDBCounts();
	});
	
}

const importTabDelimitedSentences = exports.importTabDelimitedSentences = () => {
	var language = global.sharedObject.language;
	var native= global.sharedObject.native;
	const files = dialog.showOpenDialogSync(mainWindow, {
		properties: ['openFile'],
		filters: [
			{name: 'Tab-delimited text files', extensions: ['txt']}
		]
		
	});
	if (files) { var fn = files[0] }
	fs.readFile(fn, "utf8", (err,data) => {
		if(err) throw err;
		var lines=data.split(/[\r\n]+/);
		var len=lines.length;
		console.log(len + " entries found");
		db.run("BEGIN TRANSACTION");
		for(var i=0;i<len;i++) {
			var pieces=lines[i].split("\t");
			db.run("INSERT OR REPLACE INTO tm(srclang, tgtlang, source, target) VALUES(?,?,?,?)", [language, native, pieces[0], pieces[1]]);
		}
		db.run("COMMIT");
		updateDBCounts();
	});
	
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
		case "es": {
			var voice="Penelope";
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
			shell.openPath(output);	
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

function tokenizeWords(s) {
	s=s.trim();
	var words=s.split(/[\u0009\u000a\u000b\u000d\u0020\u00a0\u2000-\u2009\u200a\u2028\u2029\u202f\u3000\d\u2000-\u2069»:«,\.!)(\[\]\?;»«;:']+/u);
	words=words.filter(function(n) { return n != ""});
	return(words);
}

const calculateTypeTokenRatio = exports.calculateTypeTokenRatio = () => {
	const sw = require('stopword');
	var language = global.sharedObject.language;
	var filter = eval(`sw.${language}`);
	var freqs={};
	var docpath = app.getPath('documents');
	var fn = path.join(docpath, 'Jorkens', 'bookText.txt');
	var booktext = fs.readFileSync(fn, {encoding:'utf8', flag:'r'});
	var words=tokenizeWords(booktext);
	words = sw.removeStopwords(words, filter);
	
	var len=words.length;
	for(var i=0;i<len;i++) {
		if(lemmas[words[i]]) {
			words[i] = lemmas[words[i]];
		}
	}
	for(var i=0;i<len;i++) {
		if(!freqs[words[i]]) {
			freqs[words[i]] = 1;
		} else {
			freqs[words[i]] += 1;
		}
	}
	var pairlist=_.pairs(freqs);
	var vocabSize=pairlist.length;
	var textRich=vocabSize/len;
	textRich=textRich.toFixed(2);
	mainWindow.webContents.send('text-richness', textRich);
}

const getWordFrequencies = exports.getWordFrequencies = () => {
	const sw = require('stopword');
	var language = global.sharedObject.language;
	var filter = eval(`sw.${language}`);
	var freqs={};
	var docpath = app.getPath('documents');
	var fn = path.join(docpath, 'Jorkens', 'bookText.txt');
	var booktext = fs.readFileSync(fn, {encoding:'utf8', flag:'r'});
	var words=tokenizeWords(booktext);
	words = sw.removeStopwords(words, filter);
	
	var len=words.length;
	for(var i=0;i<len;i++) {
		if(lemmas[words[i]]) {
			words[i] = lemmas[words[i]];
		}
	}
	for(var i=0;i<len;i++) {
		if(!freqs[words[i]]) {
			freqs[words[i]] = 1;
		} else {
			freqs[words[i]] += 1;
		}
	}
	var pairlist=_.pairs(freqs);
	var vocabSize=pairlist.length;
	var textRich=vocabSize/len;
	textRich=textRich.toFixed(2);
	mainWindow.webContents.send('text-richness', textRich);
	pairlist=pairlist.sort(function(a,b) 
		{ 
			if(a[1] < b[1]) return 1;
			if(a[1] > b[1]) return -1;
			return 0;
		}
	);
	var output=pairlist.join('\r\n');
	output+='\r\n';
	const fo = dialog.showSaveDialogSync(mainWindow, {
		filters: [
			{name: 'Save file', extensions: ['csv']}
		]		
	});
	if (fo) {
		fs.writeFileSync(fo, output);
	}
	

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

const buildPythonMenu = exports.buildPythonMenu = () => {
	var language = global.sharedObject.language;
	var output = [];
	var fn = path.join(docpath, 'Jorkens', 'currentChapter.txt');
	if(fs.existsSync(fn)) {
		var chaptertext = fs.readFileSync(fn, {encoding:'utf8', flag:'r'});
	
	} else {
		var chaptertext = '';
	}
	var pythonScriptPath = path.join(docpath, 'Jorkens', 'Python');
	if(process.platform == 'win32') {
		var myPythonPath = path.join('C:', 'Python38', 'python.exe');
	} else if(process.platform == 'linux') {
		var myPythonPath = '/usr/bin/python3';
	}

	let options = {
		mode: 'text',
		pythonPath: myPythonPath,
		pythonOptions: ['-u'], // get print results in real-time
		scriptPath: pythonScriptPath,
		args: [language, chaptertext]
	};
	var myMenu=Menu.getApplicationMenu();
	var pythonmenu = myMenu.items[7].submenu.getMenuItemById('python').submenu;
	
	fs.readdir(pythonScriptPath, (err, files) => {
		files.forEach(file => {
			// var thisscript = path.join(docpath, 'Jorkens', 'Python', file);
			pythonmenu.append(new MenuItem ({
				label: file,
				click() {
					let pyshell = new PythonShell(file, options);
					pyshell.send(chaptertext);
					pyshell.on('message', function (message) {
						// received a message sent from the Python script (a simple "print" statement)
						
						if(file == 'stanza-lemmatizer.py') {
							output.push(message);
						} else {
							console.log(message);
						}
					});
					pyshell.end(function (err,code,signal) {
						if (err) throw err;
						if(file == 'stanza-lemmatizer.py') {
							processStanza(output);
						}
						
/* 						console.log('The exit code was: ' + code);
						console.log('The exit signal was: ' + signal);
						console.log('finished'); */
					});
				}
			}))
		});
	});
}

const setTheme = exports.setTheme = (mode) => {
	config.theme = mode;
	storage.set('config', config);
	mainWindow.webContents.send('change-theme', mode);
}

const playAudio = exports.playAudio = () => {
	const files = dialog.showOpenDialogSync(mainWindow, {
			properties: ['openFile'],
			filters: [
				{name: 'MP3 files', extensions: ['mp3']},
				{name: 'WAVE files', extensions: ['wav']},
				{name: 'OGG files', extensions: ['ogg']},
		]
	});
	var fn = files[0];
	audioWindow = new BrowserWindow({
		show: false,
		width: 600,
		height: 300,
		webPreferences: {
			nodeIntegration: true
		}
	});
	audioWindow.loadURL(path.join(__dirname, 'audioplayer.html'));
	// audioWindow.webContents.openDevTools();
	audioWindow.webContents.on('did-finish-load', () => {
		audioWindow.webContents.send('play-audio', fn);
	});
	audioWindow.once('ready-to-show', () => {
		audioWindow.setMenu(null);
		audioWindow.show();
	});
	audioWindow.on('closed', () => {
		audioWindow = null;
    });
	
}

const convertToEpub = exports.convertToEpub = (fn) => {
	if(!fn) {
		const files = dialog.showOpenDialogSync(mainWindow, {
			properties: ['openFile']
	});
	var fn = files[0];
	} 
	var ext = path.extname(fn);
	var output = fn.replace(ext, '.epub');
	var language = global.sharedObject.language;
	var child = require('child_process').execFile;
	var executablePath = "C:\\Program Files (x86)\\Calibre2\\ebook-convert.exe";
	var parameters = [fn, output, "--language", language];
	child(executablePath, parameters, function(err, data) {
		if(err){
			console.error(err);
			return;
		}
 
		console.log(data.toString());
		openFile(output, 0);
	});	
	
	
}

const runAnki = exports.runAnki = () => {
	var child = require('child_process').execFile;
	var executablePath = "C:\\Program Files\\Anki\\anki-console.exe";
	//var parameters = ["-b", "%APPDATA%\\Anki2\\User 1"];
	var parameters = [];
	child(executablePath, parameters, function(err, data) {
		if(err){
			console.error(err);
		return;
		}
 
		console.log(data.toString());
	});
}

const addHighlight = exports.addHighlight = () => {
	mainWindow.webContents.send('add-highlight');
}

const jumpToSearchResult = exports.jumpToSearchResult = (cfi) => {
	mainWindow.webContents.send('jump-to-search-result', cfi);
}