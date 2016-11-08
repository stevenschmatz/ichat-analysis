import path from 'path';
import nconf from 'nconf';
import ChatDBManager from './model/ChatDBManager';

function init() {
  nconf.argv().env().file({file: path.join(__dirname, "config.json")});
}

function main() {
  let chatManager = new ChatDBManager();
  const identifier = nconf.get("debugEmail");

  chatManager.getConversationMeanSentimentScores(identifier).then(result => {
    console.log(result.reverse());
  }).catch(err => {
    console.log(`ERROR: ${err}`);
  });
}

init();
main();

