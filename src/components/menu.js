const {app, BrowserWindow, Menu, shell } = require('electron');
const mainProcess = require('../main.js');

module.exports = function(mainWindow){
    return Menu.buildFromTemplate([
	{
    label: 'File',
    submenu: [
      {
	label: 'Open file',
	accelerator: 'CmdOrCtrl+O',
	click: () => {
          mainProcess.chooseBook();
       	 }
    },
	{
	label: 'Close file',
	accelerator: 'CmdOrCtrl+Q',
	click: () => {
          	mainProcess.clearBook();
       	 }
    },
	{
		  label: "Library",
		  click: () => {
			  mainProcess.showLibrary();
		  }
	  },
	  
	 
	  /* {
		  label: "Preferences",
		  click: () => {
			  console.log(mainProcess.preferences);
			  mainProcess.preferences.show();
		  }
	  }, */
        
      { role: 'quit' }
    ]
  },
  // { role: 'editMenu' }
  {
    label: 'Edit',
    submenu: [
		 {
	label: 'Search',
	accelerator: 'CmdOrCtrl+F',
	click: () => {
		mainProcess.getSearchTerm();
       	 }		 
    },

      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' }
    ]
  },
  // { role: 'viewMenu' }
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forcereload' },
      { role: 'toggledevtools' },
      { type: 'separator' },
      { role: 'resetzoom' },
      { role: 'zoomin' },
      { role: 'zoomout' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  // { role: 'windowMenu' }
  { 
	label: 'Dictionaries',
	submenu: [
	{ label: 'Add glossary entry',
	accelerator: 'CmdOrCtrl+G',
	click: () => {
          	mainProcess.createGlossWindow();
       	 }
    },
	
		{
	label: "Import dictionary",
	submenu: [
	
	{ label: 'Import tab-delimited text dictionary',
	click: () => {
          	mainProcess.importDictionary();
       	 }
    },
	
		{ label: 'Import Facebook MUSE dictionary',
	click: () => {
          	mainProcess.importFacebookMUSEDictionary();
       	 }
    },
	
			{ label: 'Import Kobo dictionary',
		click: () => {
          	mainProcess.importKoboDictionary();
       	 }
    },
	
		{ label: 'Import Yomichan dictionary',
		click: () => {
          	mainProcess.importYomichanDictionary();
       	 }
    },
	
		{ label: 'Import Migaku (single JSON file) dictionary',
		click: () => {
          	mainProcess.importMigakuDictionary();
       	 }
    },
	
	{ label: 'Import Kaikki (Wiktionary) dictionary',
		click: () => {
          	mainProcess.importKaikkiDictionary();
       	 }
    },
	
	]	
	},
	
	
	{
	label: 'Edit dictionary database',
	click: () => {
		mainProcess.editDatabase('dictionary');
       	 }		 
    },

	{ label: 'Export dictionary',
	accelerator: '',
	click: () => {
          	mainProcess.exportDictionary();
       	 }
    },
	{ label: 'Search Wordreference',
	click: () => {
          	mainProcess.createSearchWindow('wf');
       	 }
    },
	{ label: 'Search Wiktionary',
	click: () => {
          	mainProcess.createSearchWindow('wik');
       	 }
    },
	{ label: 'Search Free Dictionary',
	click: () => {
          	mainProcess.createSearchWindow('freed');
       	 }
    },
	
		{ label: 'Search Glosbe',
	accelerator: 'CmdOrCtrl+Shift+W',
	click: () => {
          	mainProcess.searchGlosbeDictionary();
       	 }
    },
	
	{ label: 'Search Google Images',
	click: () => {
		
		mainProcess.createSearchWindow('images');
	}
    },
	
	
	{
	label: "Afrikaans",
	id: "af",
	visible: false,
	submenu: [
	{ label: 'Search Glosbe',
	accelerator: '',
	click: () => {
          	mainProcess.createSearchWindow('af-glosbe');
       	 }
    },
	
	]	
	},
	
	
	{
	label: "Albanian",
	id: "sq",
	visible: false,
	submenu: [
	{ label: 'Search Van Dale',
	accelerator: '',
	click: () => {
          	mainProcess.createSearchWindow('vandale');
       	 }
    },
	
	]	
	},
	
	{
	label: "Arabic",
	id: "ar",
	visible: false,
	submenu: [
	{ label: 'Search Van Dale',
	accelerator: '',
	click: () => {
          	mainProcess.createSearchWindow('vandale');
       	 }
    },
	
	]	
	},
	
	
	
	{
	label: "Bosnian",
	id: "bs",
	visible: false,
	submenu: [
	{ label: 'Search Van Dale',
	accelerator: '',
	click: () => {
          	mainProcess.createSearchWindow('vandale');
       	 }
    },
	
	]	
	},
	
	{
	label: "Bulgarian",
	id: "bg",
	visible: false,
	submenu: [
	{ label: 'Search Van Dale',
	accelerator: '',
	click: () => {
          	mainProcess.createSearchWindow('vandale');
       	 }
    },
	
	]	
	},
	
	{
	label: "Catalan",
	id: "ca",
	visible: false,
	submenu: [
	{ label: 'Search Catalandictionary.org',
	accelerator: '',
	click: () => {
          	mainProcess.createSearchWindow('cdict.org');
       	 }
    },
	
	]	
	},
	
	
	
	{
	label: "Chinese",
	id: "zh",
	visible: false,
	submenu: [
	{ label: 'Search Dict.cn',
	click: () => {
          	mainProcess.createSearchWindow('dictcn');
       	 }
    },
	{ label: 'Search MDBG',
	click: () => {
          	mainProcess.createSearchWindow('mdbg');
       	 }
    },
	
	{ label: 'Search Yellowbridge',
	click: () => {
          	mainProcess.createSearchWindow('yellowbridge');
       	 }
    },
	
	]	
	},
	
	{
	label: "Croatian",
	id: "hr",
	visible: false,
	submenu: [
	{ label: 'Search Rjecnik.net',
	accelerator: '',
	click: () => {
          	mainProcess.createSearchWindow('rjecnik');
       	 }
    },
	
	]	
	},
	
	{
	label: "Czech",
	id: "cs",
	visible: false,
	submenu: [
	{ label: 'Search Lingea',
	accelerator: '',
	click: () => {
          	mainProcess.createSearchWindow('lingea');
       	 }
    },
	{ label: 'Search Seznam.cz',
	accelerator: '',
	click: () => {
          	mainProcess.createSearchWindow('seznam');
       	 }
    },
	{ label: 'Search Slovnik.cz',
	accelerator: '',
	click: () => {
          	mainProcess.createSearchWindow('slovnik');
       	 }
    },
	
	]	
	},
	
	{
	label: "Danish",
	id: "da",
	visible: false,
	submenu: [
	{ label: 'Search Den Danske Ordbog',
	accelerator: '',
	click: () => {
          	mainProcess.createSearchWindow('danskeordbog');
       	 }
    },
	
	]	
	},
	
	{
	label: "Dutch",
	id: "nl",
	visible: false,
	submenu: [
	{ label: 'Search Van Dale',
	accelerator: '',
	click: () => {
          	mainProcess.createSearchWindow('vandale');
       	 }
    },
	
	]	
	},
	
	
	{
	label: "English",
	id: "en",
	visible: false,
	submenu: [
	{ label: 'Search Lexico (Oxford)',
	click: () => {
          	mainProcess.createSearchWindow('lexico');
       	 }
    },
	{ label: 'Search Merriam-Webster',
	click: () => {
          	mainProcess.createSearchWindow('mwebster');
       	 }
    },
	
	{ label: 'Search WordNet',
	click: () => {
          	mainProcess.wordNetLookup();
       	 }
    },
	
	]	
	},
	
	{
	label: "Esperanto",
	id: "eo",
	visible: false,
	submenu: [
	{ label: 'Search Vortaro.net',
	click: () => {
          	mainProcess.createSearchWindow('vortaro');
       	 }
    },
	{ label: 'Search Lernu.net',
	click: () => {
          	mainProcess.createSearchWindow('lernu');
       	 }
    },
	{ label: 'Search Dictionaryq',
	click: () => {
          	mainProcess.createSearchWindow('dictq-eo');
       	 }
    },
	
	]	
	},
	
	
	
	
	
	{
	label: "Finnish",
	id: "fi",
	visible: false,
	submenu: [
	{ label: 'Search Suomi-englanti sanakirja',
	accelerator: '',
	click: () => {
          	mainProcess.createSearchWindow('sanakirja');
       	 }
    },
	
	]	
	},
	
	{
	label: "French",
	id: "fr",
	visible: false,
	submenu: [
	{ label: 'Search Larousse',
	click: () => {
          	mainProcess.createSearchWindow('larousse');
       	 }
    },
	{ label: 'Search Le Robert',
	click: () => {
          	mainProcess.createSearchWindow('lerobert');
       	 }
    },
	{ label: 'Search CNRTL',
	click: () => {
          	mainProcess.createSearchWindow('cnrtl');
       	 }
    },
	{ label: 'Search TV5',
	click: () => {
          	mainProcess.createSearchWindow('tv5');
       	 }
    },
	{ label: 'Search Reverso',
	click: () => {
          	mainProcess.createSearchWindow('reverso');
       	 }
    },
	
	]	
	},
	
	{
	label: "German",
	id: "de",
	visible: false,
	submenu: [
	{ label: 'Search DWDS',
	click: () => {
          	mainProcess.createSearchWindow('dwds');
       	 }
    },
	{ label: 'Search dict.cc',
	click: () => {
          	mainProcess.createSearchWindow('dictcc');
       	 }
    },
	{ label: 'Search Leo',
	click: () => {
          	mainProcess.createSearchWindow('leo');
       	 }
    },
	{ label: 'Search Beolingus',
	click: () => {
          	mainProcess.createSearchWindow('beolingus');
       	 }
    },
	{ label: 'Search Pons',
	click: () => {
          	mainProcess.createSearchWindow('pons-de');
       	 }
    },
	
	]	
	},
	
	
	
	{
	label: "Georgian",
	id: "ka",
	visible: false,
	submenu: [
	{ label: 'Search translate.ge',
	click: () => {
          	mainProcess.createSearchWindow('translate.ge');
       	 }
    },
	
	]	
	},
	
	{
	label: "Greek",
	id: "el",
	visible: false,
	submenu: [
	{ label: 'Search Free Dictionary',
	accelerator: '',
	click: () => {
          	mainProcess.createSearchWindow('freedict-el');
       	 }
    },
	
	]	
	},
	
	
	{
	label: "Hebrew",
	id: "he",
	visible: false,
	submenu: [
	{ label: 'Search Morfix',
	click: () => {
          	mainProcess.createSearchWindow('morfix');
       	 }
    },
	{ label: 'Search Milog',
	click: () => {
          	mainProcess.createSearchWindow('milog');
       	 }
    },
	
	]	
	},
	
	
	
	{
	label: "Hindi",
	id: "hi",
	visible: false,
	submenu: [
	{ label: 'Search Shabdkosh',
	accelerator: '',
	click: () => {
          	mainProcess.createSearchWindow('shabdkosh');
       	 }
    },
	
	{ label: 'Search Hindi-English.com',
	accelerator: '',
	click: () => {
          	mainProcess.createSearchWindow('hindi-english');
       	 }
    },
	
	]	
	},
	
	{
	label: "Hungarian",
	id: "hu",
	visible: false,
	submenu: [
	
	{ label: 'Search Dict.cc (HU)',
	accelerator: '',
	click: () => {
          	mainProcess.createSearchWindow('hudictcc');
       	 }
    },
	
	{ label: 'Search Bab.la (HU)',
	accelerator: '',
	click: () => {
          	mainProcess.createSearchWindow('hubabla');
       	 }
    },
	
	{ label: 'Search DictZone (HU)',
	accelerator: '',
	click: () => {
          	mainProcess.createSearchWindow('hudictzone');
       	 }
    },
	
	{ label: 'Search SZTAKI',
	accelerator: '',
	click: () => {
          	mainProcess.createSearchWindow('sztaki');
       	 }
    },
	
	{ label: 'Search Angol-Magyar Szotar',
	accelerator: '',
	click: () => {
          	mainProcess.createSearchWindow('amszotar');
       	 }
    },
	
	]	
	},
	
	
	{
	label: "Indonesian",
	id: "id",
	visible: false,
	submenu: [
	{ label: 'Search Kamus',
	accelerator: '',
	click: () => {
          	mainProcess.createSearchWindow('kamus');
       	 }
    },
	
	]	
	},
	
	
	{
	label: "Irish",
	id: "ga",
	visible: false,
	submenu: [
	{ label: 'Search Teanglann',
	accelerator: '',
	click: () => {
          	mainProcess.createSearchWindow('teanglann');
       	 }
    },
	
	]	
	},
	
	{
	label: "Italian",
	id: "it",
	visible: false,
	submenu: [
	{ label: 'Search Corriere della sera (English)',
	click: () => {
          	mainProcess.createSearchWindow('cdse');
       	 }
    },
	{ label: 'Search Corriere della sera (Italian)',
	click: () => {
          	mainProcess.createSearchWindow('cdsi');
       	 }
    },
	{ label: 'Search Treccani',
	click: () => {
          	mainProcess.createSearchWindow('treccani');
       	 }
    },
	{ label: 'Search bab.la',
	click: () => {
          	mainProcess.createSearchWindow('babla');
       	 }
    },
	
	]	
	},
	
	{
	label: "Japanese",
	id: "ja",
	visible: false,
	submenu: [
	{ label: 'Search ALC.Co',
	click: () => {
          	mainProcess.createSearchWindow('alc.co');
       	 }
    },
	{ label: 'Search Jisho',
	click: () => {
          	mainProcess.createSearchWindow('jisho');
       	 }
    },
	{ label: 'Search WWWJDIC',
	click: () => {
          	mainProcess.createSearchWindow('wwwjdic');
       	 }
    },
	
	]	
	},
	
	{
	label: "Korean",
	id: "ko",
	visible: false,
	submenu: [
	{ label: 'Search Daum',
	click: () => {
          	mainProcess.createSearchWindow('daum');
       	 }
    },
	{ label: 'Search Naver',
	click: () => {
          	mainProcess.createSearchWindow('naver');
       	 }
    },
	{ label: 'Search zKorean',
	click: () => {
          	mainProcess.createSearchWindow('zkorean');
       	 }
    },
	
	{ label: 'Search Korean-English Learner\'s Dictionary',
	click: () => {
          	mainProcess.createSearchWindow('krdict');
       	 }
    },
	
	]	
	},
	
	{
	label: "Latin",
	id: "la",
	visible: false,
	submenu: [
	{ label: 'Search Whitaker',
	click: () => {
          	mainProcess.createSearchWindow('whitaker');
       	 }
    },
	{ label: 'Search LatDict',
	click: () => {
          	mainProcess.createSearchWindow('latdict');
       	 }
    },
	
	]	
	},
	
	
	{
	label: "Macedonian",
	id: "mk",
	visible: false,
	submenu: [
	{ label: 'Search EUdict',
	accelerator: '',
	click: () => {
          	mainProcess.createSearchWindow('eudict-mk');
       	 }
    },
	
	]	
	},
	
	{
	label: "Norwegian",
	id: "no",
	visible: false,
	submenu: [
	{ label: 'Search NAOB',
	accelerator: '',
	click: () => {
          	mainProcess.createSearchWindow('naob');
       	 }
    },
	
	]	
	},
	
	
	{
	label: "Pashto",
	id: "ps",
	visible: false,
	submenu: [
	{ label: 'Search The Pashto',
	accelerator: '',
	click: () => {
          	mainProcess.createSearchWindow('thepashto');
       	 }
    },
	
	]	
	},
	
	{
	label: "Persian",
	id: "fa",
	visible: false,
	submenu: [
	{ label: 'Search Farsi123',
	accelerator: '',
	click: () => {
          	mainProcess.createSearchWindow('farsi123');
       	 }
    },
	
	]	
	},
	
	{
	label: "Polish",
	id: "pl",
	visible: false,
	submenu: [
	{ label: 'Search Lektorek',
	accelerator: '',
	click: () => {
          	mainProcess.createSearchWindow('lektorek');
       	 }
    },
	{ label: 'Search Ling.pl',
	accelerator: '',
	click: () => {
          	mainProcess.createSearchWindow('ling.pl');
       	 }
    },
	{ label: 'Search WSJP',
	accelerator: '',
	click: () => {
          	mainProcess.createSearchWindow('wsjp');
       	 }
    },
	
	]	
	},
	
	{
	label: "Portuguese",
	id: "pt",
	visible: false,
	submenu: [
	{ label: 'Search Priberam (European)',
	click: () => {
          	mainProcess.createSearchWindow('priberam');
       	 }
    },
	{ label: 'Search Michaelis (Brazilian)',
	click: () => {
          	mainProcess.createSearchWindow('michaelis');
       	 }
    },
	
	]	
	},
	
	
	{
	label: "Romanian",
	id: "ro",
	visible: false,
	submenu: [
	{ label: 'Search Dexonline',
	accelerator: '',
	click: () => {
          	mainProcess.createSearchWindow('dexonline');
       	 }
    },
	
	]	
	},
	
	{
	label: "Russian",
	id: "ru",
	visible: false,
	submenu: [
	{ label: 'Search Multitran',
		click: () => {
          	mainProcess.createSearchWindow('multitran');
       	 }
    },
		{ label: 'Search LingvoLive',
		click: () => {
          	mainProcess.createSearchWindow('lingvolive');
       	 }
    },
		{ label: 'Search RussianDict.net',
		click: () => {
          	mainProcess.createSearchWindow('russiandict');
       	 }
    },
	{ label: 'Search translate.academic.ru',
	click: () => {
          	mainProcess.createSearchWindow('t.a.ru');
       	 }
    },
	{ label: 'Search Gramota',
	click: () => {
          	mainProcess.createSearchWindow('gramota');
       	 }
    },
	{ label: 'Search OpenRussian.org',
	click: () => {
          	mainProcess.createSearchWindow('openrussian');
       	 }
    },
	{ label: "Search Gufo.me (Dal')",
	click: () => {
          	mainProcess.createSearchWindow('gufo');
       	 }
    },
	
	]	
	},
	
	
	{
	label: "Serbian",
	id: "sr",
	visible: false,
	submenu: [
	{ label: 'Search Krstarica',
	accelerator: '',
	click: () => {
          	mainProcess.createSearchWindow('krstarica');
       	 }
    },
	
	]	
	},
	
	
	{
	label: "Slovak",
	id: "sk",
	visible: false,
	submenu: [
	{ label: 'Search SAV',
	accelerator: '',
	click: () => {
          	mainProcess.createSearchWindow('sav');
       	 }
    },
	
	]	
	},
	
	
	{
	label: "Slovene",
	id: "sl",
	visible: false,
	submenu: [
	{ label: 'Search Pons',
	accelerator: '',
	click: () => {
          	mainProcess.createSearchWindow('sl-pons');
       	 }
    },
	
	]	
	},
	
	{
	label: "Spanish",
	id: "es",
	visible: false,
	submenu: [
	{ label: 'Search SpanishDict',
	click: () => {
          	mainProcess.createSearchWindow('spanishdict');
       	 }
    },
	{ label: 'Search the RAE',
	click: () => {
          	mainProcess.createSearchWindow('rae');
       	 }
    },
	
	]	
	},
	
	
	
	{
	label: "Swahili",
	id: "sw",
	visible: false,
	submenu: [
	{ label: 'Search africanlanguages.com',
	accelerator: '',
	click: () => {
          	mainProcess.createSearchWindow('swahili');
       	 }
    },
	
	]	
	},
	
	
	{
	label: "Swedish",
	id: "sv",
	visible: false,
	submenu: [
	{ label: 'Search Ord.se',
	accelerator: '',
	click: () => {
          	mainProcess.createSearchWindow('ord.se');
       	 }
    },
	
	]	
	},
	
	
	{
	label: "Turkish",
	id: "tr",
	visible: false,
	submenu: [
	{ label: 'Search turkishdictionary.net',
	accelerator: '',
	click: () => {
          	mainProcess.createSearchWindow('td.net');
       	 }
    },
	{ label: 'Search Sesli Sözlük',
	accelerator: '',
	click: () => {
          	mainProcess.createSearchWindow('seslisozluk');
       	 }
    },
	
	]	
	},
	
	
	
	{
	label: "Ukrainian",
	id: "uk",
	visible: false,
	submenu: [
	{ label: 'Search Slovnenya',
	accelerator: '',
	click: () => {
          	mainProcess.createSearchWindow('slovnenya');
       	 }
    },
	
	]	
	},
	
	{
	label: "Urdu",
	id: "ur",
	visible: false,
	submenu: [
	{ label: 'Search Rekhta',
	accelerator: '',
	click: () => {
          	mainProcess.createSearchWindow('rekhta');
       	 }
    },
	
	]	
	},
	
	
	{
	label: "Vietnamese",
	id: "vi",
	visible: false,
	submenu: [
	{ label: 'Search Vdict.com',
	accelerator: '',
	click: () => {
          	mainProcess.createSearchWindow('vdict');
       	 }
    },
	
	]	
	},
	
	
	{
	label: "Welsh",
	id: "cy",
	visible: false,
	submenu: [
	{ label: 'Search Geiriadur',
	accelerator: '',
	click: () => {
          	mainProcess.createSearchWindow('geiriadur');
       	 }
    },
	
	]	
	},
	
	
	{
	label: "Yiddish",
	id: "yi",
	visible: false,
	submenu: [
	{ label: 'Search yiddishdictionaryonline.com',
	accelerator: '',
	click: () => {
          	mainProcess.createSearchWindow('yiddishonline');
       	 }
    },
	
	]	
	},
	
	]
	  },
  {
	  label: "TM",
	  submenu: [
		{
		  label: "Import translation memory file (.tmx)",
		  click: () => {
          	mainProcess.importTM();
       	 }
	  },
	  {
		  label: "Import tab-delimited sentence pairs",
		  click: () => {
          	mainProcess.importTabDelimitedSentences();
       	 }
	  },
	  {
		  label: "Add sentence pair to memory",
		  click: () => {
          	mainProcess.createTMWindow();
       	 }
	  },
	  {
		  label: "TM concordance search",
		  click: () => {
          	mainProcess.concordance();
       	 }
	  },
	  {
	  	label: 'Edit TM database',
	click: () => {
		mainProcess.editDatabase('tm');
       	 }		 
    },
/* 	  {
		  label: "MyMemory search",
		  click: () => {
          	mainProcess.myMemory();
       	 }
	  }, */
	  {
		  label: "Glosbe TM search",
		  click: () => {
          	mainProcess.createSearchWindow('glosbeTM');
       	 }
	  },
	  {
		  label: 'Linguee TM search',
		  click: () => {
          	mainProcess.createSearchWindow('lingueeTM');
       	 }
	  },
	  /* {
		  label: 'Tatoeba search',
		  click: () => {
          	mainProcess.createSearchWindow('tatoeba');
       	 }
	  } */
	  ]
  },  
  {
	  label: "Speech",
	  submenu: [
	  {
		  label: "Forvo pronunciation",
		  click: () => {
          	mainProcess.createSearchWindow('forvo');
       	 }
	  },
	  {
		  label: "Windows TTS",
		  click: () => {
          	mainProcess.WindowsTTS();
       	 }
	  },
	  {
		  label: "Amazon Polly TTS",
		  accelerator: 'CmdOrCtrl+P',
		  click: () => {
          	mainProcess.playPolly();
       	 }
	  },
	  {
		  label: "Play local audio file",
		  click: () => {
          	mainProcess.playAudio();
       	 }
	  }
	  ]
  }, 
  {
	  label: 'Flashcards',
	  submenu: [
		{
		  label: 'Add flashcard',
		  click: () => {
          	mainProcess.createFlashcardWindow();
       	 }
		},
		{
		  label: 'Review flashcards',
		  click: () => {
          	mainProcess.reviewFlashcards();
       	 }
		},
		{
		  label: 'Export for Anki',
		  click: () => {
          	mainProcess.exportForAnki();
       	 }
		},
			  {
	  	label: 'Edit flashcard database',
	click: () => {
		mainProcess.editDatabase('flashcards');
       	 }		 
    },
	  ]
  },
  {
	  label: 'External',
	  submenu: [
		{
		  label: 'Python scripts',
		  id: 'python',
		  submenu: []
		}
	  ]
  },
  {
	  label: 'MT',
	  submenu: [
	  {
		  label: "Google Translate",
		 click: () => {
          	mainProcess.createSearchWindow('google-translate');
       	 }
	  },
	  {
		  label: "Amazon Translate",
		  accelerator: 'CmdOrCtrl+T',
		 click: () => {
          	mainProcess.amazonTranslate();
       	 }
	  },
	  
	  	  {
		  label: "Libre Translate",
		 click: () => {
          	mainProcess.libreTranslate();
       	 }
	  },
	  
	    	  {
		  label: "Apertium",
		 click: () => {
          	mainProcess.createSearchWindow('apertium');
       	 }
	  },
/* 	  {
		  label: "MyMemory translation",
		 click: () => {
          	mainProcess.myMemory();
       	 }
	  }, */
	  
	  ]
  },
  {
	  label: 'Tools',
	  submenu: [
	  {
		  label: "Themes",
		  submenu: [
		  
		  {
		  label: "Dark",
		  click: () => {
			  mainProcess.setTheme('dark');
		  }
		},
		{
		  label: "Light",
		  click: () => {
			  mainProcess.setTheme('light');
		  }
		},
		{
		  label: "Sepia",
		  click: () => {
			  mainProcess.setTheme('sepia');
		  }
		},
		{
		  label: "Green on black",
		  click: () => {
			  mainProcess.setTheme('greenonblack');
		  }
		},
		{
		  label: "Ruby Blue",
		  click: () => {
			  mainProcess.setTheme('rubyblue');
		  }
		},
	  {
		  label: "Nord",
		  click: () => {
			  mainProcess.setTheme('nord');
	      }
	  },
	  {
		  label: "Lavender",
		  click: () => {
			  mainProcess.setTheme('lavender');
	      }
	  },
	  {
		  label: "Lavender on blue",
		  click: () => {
			  mainProcess.setTheme('lavenderonblue');
	      }
	  },
		  ]
	  },
	  
	  	  {
		  label: "Bookmark/annotate passage",
		  click: () => {
			  mainProcess.createAnnotationWindow();
		  }
	  },
	  	  {
	  	label: 'Edit annotation database',
	click: () => {
		mainProcess.editDatabase('passages');
       	 }		 
    },
	  
	   {
		  label: "Show bookmarks/annotations",
		  click: () => {
			  mainProcess.listAnnotations();
		  }
	  },
	  
	  {
		  label: "Run Anki Flashcards",
		  click: () => {
			  mainProcess.runAnki();
		  }
	  },
	  {
		  label: "Save list of words searched this session",
		  click: () => {
			  mainProcess.saveUnknowns();
		  }
	  }, 
	  	  {
		  label: "Calculate Type-Token Ratio (text complexity)",
		  click: () => {
			  mainProcess.calculateTypeTokenRatio();
		  }
	  },
	  {
		  label: "Generate word frequency list",
		  click: () => {
			  mainProcess.getWordFrequencies();
		  }
	  },
	  
	   {
		  label: "Open parallel book",
		  click: () => {
			  mainProcess.loadParallelBook();
		  }
	  },
	  
	  {
		  label: "Open parallel GlobaL Voices articles",
		  click: () => {
			  mainProcess.getGlobalVoicesURL();
		  }
	  },
	  
	  	   {
		  label: "Transliterate selection",
		  click: () => {
			  mainProcess.transliterateSelection();
		  }
	  },
	  
	  {
		  label: "Extract keywords (RAKE)",
		  click: () => {
			  mainProcess.RAKE();
		  }
	  },
	  
	  {
		  label: "Verb conjugation (Verbix)",
		  click: () => {
			  mainProcess.createSearchWindow('verbix');
		  }
	  },
	  
	  {
		  label: "Set native language",
		  click: () => {
			  mainProcess.updateNativeLanguage();
		  }
	  },
	  {
		  label: "Set (force) foreign language",
		  click: () => {
			  mainProcess.updateForeignLanguage();
		  }
	  },
	  {
		  label: "Update user email",
		  click: () => {
			  mainProcess.updateUserEmail();
		  }
	  },
	  
	  {
		  label: "Add to secret shelf",
		  click: () => {
			  mainProcess.addToSecretShelf();
		  }
	  },
	  
	  {
		  label: "Replace words in text",
		  click: () => {
			  mainProcess.doReplacements();
		  }
	  },
	  ]
  },
  {
    label: 'Window',
    submenu: [
      { role: 'minimize' },
      { role: 'zoom' },
        { role: 'close' }
    ]
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'About',
        click: async () => {
          const { shell } = require('electron');
          await shell.openExternal('https://github.com/mcthulhu/jorkens');
        }
      }
    ]
  }
])}
 
