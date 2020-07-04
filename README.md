# jorkens
Jorkens is a desktop epub reader based on epub.js and intended for foreign language learners. The current version uses Electron.js, instead of NW.js like the previous version. Some functionality from the previous NW.js version has yet to be recreated. 

Jorkens can search for definitions of foreign words in numerous online dictionaries, and also contains a SQLite database to store a local glossary and translation memory. (Note: The local database is initially empty, and needs to be populated before search results can be returned.) A highlighted word or partial word will be automatically looked up in the glossary and any matches will be displayed; if none are found a concordance search will be done next (see next paragraph). Glossaries can be imported from and exported to text files. 

Jorkens can also search Google Images for highlighted words; image search results can be surprisingly useful for showing the meanings of foreign words, as well as finding images to use in flashcards. 

The local translation memory can be used for bilingual concordance searches, showing all sentences where the highlighted word was found as well as their translations.  It can thus function indirectly as a secondary dictionary. Jorkens can also perform similar concordance searches on the Linguee Web site.  Translation memories can be imported from .tmx (Translation Memory eXchange) files. 

Jorkens currently supports text-to-speech (TTS) using a number of Windows TTS voices (as long as the user has installed the ones needed), as well as Amazon Polly for more limited passages (note that Amazon Polly voices can also be downloaded and installed locally). Jorkens can also search Forvo for individual word pronunciations. 

So far Jorkens supports machine translation through Amazon Translate; Google Translate will be added later. 

Jorkens has an internal flashcard database and basic flashcard review, with cards presented in random order so you can test whether you know a card or not, with a score kept for the current review session. This is not a spaced repetition system (SRS), though that may come later. Jorkens' flashcards can be exported to text files to be imported into Anki, a very good SRS program, however. 

The Tools menu includes an option to generate a word frequency list based on the current chapter, and save it as a .csv file. 

For future goals and desired features, see the Wiki. 

Jorkens has so far been tested only on a Windows 10 machine, but it should be possible to build Linux and MacOS versions in the future with minor modifications. A compiled released version has not been posted yet because the source code is changing rapidly, but in the meantime, users should be able to run the working source code after installing node.js, npm, and Electron (electron-forge), by executing 'npm start' at the command line in the main jorkens directory. 

The name Jorkens is from the storyteller character in the short story collections by Lord Dunsany. 


