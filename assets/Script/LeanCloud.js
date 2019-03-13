const {
  Client,
  Region,
  Event,
  ReceiverGroup,
  setAdapters,
  LogLevel,
  setLogger
} = Play;

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
  getClient
};
