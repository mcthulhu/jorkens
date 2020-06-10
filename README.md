# jorkens
Jorkens is a desktop epub reader based on epub.js and intended for foreign language learners. The current version uses Electron.js, instead of NW.js like the previous version. Jorkens can search for definitions of foreign words in numerous online dictionaries, and also contains a SQLite database to store a local glossary and translation memory. (Note: The local database is initially empty, and needs to be populated before search results can be returned.) A highlighted word or partial word will be automatically looked up in the glossary and any matches will be displayed; if none are found a concordance search will be done next (see next paragraph). Glossaries can be imported from and exported to text files. 

Jorkens can also search Google Images for highlighted words. 

The local translation memory can be used for bilingual concordance searches, showing all sentences where the highlighted word was found as well as their translations.  It can thus function indirectly as a secondary dictionary. Jorkens can also perform similar concordance searches on the Linguee Web site.  Translation memories can be imported from .tmx (Translation Memory eXchange) files. 

Jorkens currently supports text-to-speech (TTS) using a number of Windows TTS voices, as well as Amazon Polly for more limited passages. It can also search Forvo for individual word pronunciations. 

So far Jorkens supports machine translation through Amazon Translate; Google Translate will be added later. 

Future features will include an internal flashcard database and flashcard review, along with export for Anki; parallel text display; support for more ebook formats; the generation of word frequency lists; and the ability for the user to execute Python scripts (for example, using NLTK) against part or all of the foreign language text currently loaded. Some functionality from the previous version has yet to be restored. 


