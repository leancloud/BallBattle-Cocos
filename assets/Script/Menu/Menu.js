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

  async onJoinBtnClicked() {
    const roomId = this.roomIdEditText.string;
    if (roomId === undefined || roomId.length === 0) {
      return;
    }
    const userId = `${parseInt(Math.random() * 1000000)}`;
    initClient(userId);
    const client = getClient();
    try {
      await client.connect();
      cc.log("connect done");
      await client.joinOrCreateRoom(roomId);
      client.pauseMessageQueue();
      cc.director.loadScene("battle");
    } catch (err) {
      cc.log(err);
    }
  },

  // LIFE-CYCLE CALLBACKS:

  // onLoad () {},

  start() {}

  // update (dt) {},
});
