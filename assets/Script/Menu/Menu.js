const LeanCloud = require("../LeanCloud");
const { initClient, getClient } = LeanCloud;

/**
 * 菜单
 */
cc.Class({
  extends: cc.Component,

  properties: {
    roomIdEditText: {
      type: cc.EditBox,
      default: null
    }
  },

  onJoinBtnClicked() {
    const roomId = this.roomIdEditText.string;
    if (roomId === undefined || roomId.length === 0) {
      return;
    }
    const userId = `${parseInt(Math.random() * 1000000)}`;
    initClient(userId);
    const client = getClient();
    client
      .connect()
      .then(() => {
        cc.log("connect done");
        return client.joinOrCreateRoom(roomId);
      })
      .then(() => {
        client.pauseMessageQueue();
        cc.director.loadScene("battle");
      })
      .catch(err => {
        cc.log(err);
      });
  },

  // LIFE-CYCLE CALLBACKS:

  // onLoad () {},

  start() {}

  // update (dt) {},
});
