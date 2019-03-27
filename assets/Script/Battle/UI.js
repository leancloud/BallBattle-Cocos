const LeanCloud = require("../LeanCloud");
const PlayerInfoItem = require("./PlayerInfoItem");

const { getClient } = LeanCloud;

/**
 * 战斗 UI
 */
cc.Class({
  extends: cc.Component,

  properties: {
    playerInfoListNode: {
      type: cc.Node,
      default: null
    },
    playerInfoItemTemplete: {
      type: cc.Prefab,
      default: null
    },
    myWeightLabel: {
      type: cc.Label,
      default: null
    },
    timeLabel: {
      type: cc.Label,
      default: null
    }
  },

  /**
   * 初始化 UI
   */
  initUI() {
    this._playerInfoItems = [];
    const client = getClient();
    const playerList = client.room.playerList;
    playerList.forEach(player => {
      const item = this._newPlayerInfoItem();
      this._playerInfoItems.push(item);
    });
    this.updateList();
    // 游戏计时
    this._duration = client.room.customProperties.duration;
    // 更新游戏时间
    this.schedule(() => {
      this._duration++;
      this.timeLabel.string = `${this._duration}s`;
    }, 1);
  },

  /**
   * 刷新玩家列表
   */
  updateList() {
    const client = getClient();
    const playerList = client.room.playerList;
    const sortedPlayerList = playerList.sort((p1, p2) => {
      const { weight: p1Weight } = p1.customProperties;
      const { weight: p2Weight } = p2.customProperties;
      return p2Weight - p1Weight;
    });
    for (let i = 0; i < sortedPlayerList.length; i++) {
      const player = sortedPlayerList[i];
      const playerInfoItem = this._playerInfoItems[i];
      const { weight } = player.customProperties;
      playerInfoItem.setInfo(i + 1, player.userId, weight);
    }
    // 更新自身重量
    const { weight: myWeight } = client.player.customProperties;
    this.myWeightLabel.string = `当前体重: ${myWeight}g`;
  },

  /**
   * 增加玩家
   */
  addPlayerInfoItem() {
    const item = this._newPlayerInfoItem();
    this._playerInfoItems.push(item);
    this.updateList();
  },

  /**
   * 移除玩家
   */
  removePlayerInfoItem() {
    const playerInfoItem = this._playerInfoItems.pop();
    this.playerInfoListNode.removeChild(playerInfoItem.node);
    this.updateList();
  },

  _newPlayerInfoItem() {
    const playerInfoItemNode = cc.instantiate(this.playerInfoItemTemplete);
    this.playerInfoListNode.addChild(playerInfoItemNode);
    const playerInfoItem = playerInfoItemNode.getComponent(PlayerInfoItem);
    return playerInfoItem;
  },

  // LIFE-CYCLE CALLBACKS:

  // onLoad () {},

  onDestroy() {
    this.unscheduleAllCallbacks();
  }
});
