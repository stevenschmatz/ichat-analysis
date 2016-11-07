// ChatDBManager.js

import process from 'process';
import path from 'path';
import nconf from 'nconf';

const sqlite3 = require('sqlite3').verbose();

export default class ChatDBManager {
  constructor() {
    let dbPath;

    if (nconf.get("debug")) {
      dbPath = nconf.get("dbPath");
    } else {
      dbPath = path.join(process.env['HOME'], "Library/Messages/chat.db");
    }

    this.db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);
  }

  query(query) {
    return new Promise((resolve, reject) => {
      this.db.all(query, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  debug() {
    const query = "SELECT text FROM message LIMIT 10";

    this.query(query).then(result => {
      const messages = result.map(row => row.text);
      console.log(messages);
    }).catch(err => {
      console.log(err);
    });
  }

  allChatIdentifiers() {
    const query = "SELECT chat_identifier FROM chat";
    
    return new Promise((resolve, reject) => {
      this.query(query).then(result => {
        resolve(result.map(record => record.chat_identifier));
      }).catch(err => {
        reject(err);
      });
    });
  }

  /**
   * Returns all message data for the given identifier.
   * @param {string} identifier the ID of the conversation recipient
   * @return {array} an array of (is_from_me, text) pairs for the given person.
   */
  getAllMessagesForIdentifier(identifier) {
    const query = `
      SELECT * FROM message where handle_id = (
        SELECT handle_id FROM chat_handle_join WHERE chat_id = (
          SELECT ROWID FROM chat WHERE guid='iMessage;-;${identifier}'
        )
      )
    `;

    return new Promise((resolve, reject) => {
      this.query(query).then(result => {
        const filteredResult = result.map(entry => {
          return {
            text: entry.text,
            is_from_me: entry.is_from_me === 1 ? true : false,
            date: new Date(entry.date),
            attachment: entry.cache_has_attachments === 1 ? true : false
          };
        });

        resolve(filteredResult);
      }).catch(err => {
        reject(err);
      });
    });
  }

  /**
   * Generates an array of the word frequencies, sorted by most first.
   * @param {string} identifier the ID of the conversation recipient
   * @return {array} An array of (word, count) pairs.
   */
  getWordFrequencies(identifier) {
    return new Promise((resolve, reject) => {
      this.getAllMessagesForIdentifier(identifier).then(messages => {
        let stats = {};

        messages.filter(msg => !msg.attachment).map(messageData => {

          const text = messageData.text;
          const cleanText = text.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g,"");
          const words = cleanText.split(/\s/);

          words.map(rawWord => {
            const word = rawWord.toLowerCase();
            stats[word] = stats[word] || 0;
            stats[word]++;
          });
        });

        const words = Object.keys(stats);
        const data = words.sort((a, b) => stats[b] - stats[a]).map(word => {
          return {word: word, count: stats[word]};
        });

        resolve(data);

      }).catch(err => {
        reject(err);
      });
    });
  }
}
