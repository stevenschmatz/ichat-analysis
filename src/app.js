import path from 'path';
import nconf from 'nconf';
import ChatDBManager from './model/ChatDBManager';

function init() {
  nconf.argv().env().file({file: path.join(__dirname, "config.json")});
}

function main() {
  let chatManager = new ChatDBManager();
  const identifier = nconf.get("debugEmail");

  chatManager.getAllMessagesForIdentifier(identifier).then(messageData => {
    console.log(messageData.length);
  });
}

init();
main();

