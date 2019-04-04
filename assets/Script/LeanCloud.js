let PlaySDK;

if (cc.sys.WECHAT_GAME == cc.sys.platform) {
  PlaySDK = require("./play");
} else {
  PlaySDK = Play;
}

const { Client } = PlaySDK;

let client = null;

function initClient(userId) {
  client = new Client({
    appId: "vAGmhiMWKL36JMXdepqx3sgV-gzGzoHsz",
    appKey: "Gt9CnVkM20XGFkAFkEkCKULE",
    userId
  });
}

function getClient() {
  return client;
}

module.exports = {
  initClient,
  getClient,
  Play: PlaySDK
};
