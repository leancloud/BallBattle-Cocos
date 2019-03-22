const LeanCloud = require("../LeanCloud");
const PlayerInfoItem = require("./PlayerInfoItem");
const Constants = require("../Constants");

const { getClient } = LeanCloud;
const { Event } = Play;

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

  initPlay() {
    this._playerInfoItems = [];
    const client = getClient();
    client.on(
      Event.PLAYER_CUSTOM_PROPERTIES_CHANGED,
      this.onPlayerPropertiesChanged,
      this
    );
    client.on(Event.CUSTOM_EVENT, this.onCustomEvent, this);
    // 设置玩家信息 UI
    const playerList = client.room.playerList;
    playerList.forEach(() => {
      this._newPlayerInfoItem();
    });
    this._updateList();
  },

  startTimer() {
    // 游戏时间
    const client = getClient();
    this._duration =
      client.room.customProperties.duration || Constants.GAME_DURATION;
    // 更新游戏时间
    setInterval(() => {
      this._duration--;
      this.timeLabel.string = `${this._duration}`;
    }, 1000);
  },

  _newPlayerInfoItem() {
    const playerInfoItemNode = cc.instantiate(this.playerInfoItemTemplete);
    this.playerInfoListNode.addChild(playerInfoItemNode);
    const playerInfoItem = playerInfoItemNode.getComponent(PlayerInfoItem);
    this._playerInfoItems.push(playerInfoItem);
  },

  _updateList() {
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

  // Play Event

  onCustomEvent({ eventId, eventData }) {
    if (eventId == Constants.BORN_EVENT) {
      this._newPlayerInfoItem();
      this._updateList();
    } else if (eventId === Constants.EAT_EVENT) {
    } else if (eventId === Constants.KILL_EVENT) {
    } else if (eventId === Constants.REBORN_EVENT) {
    } else if (eventId === Constants.PLAYER_LEFT_EVENT) {
      const playerInfoItem = this._playerInfoItems.pop();
      this.playerInfoListNode.removeChild(playerInfoItem.node);
      this._updateList();
    }
  },

  onRoomPropertiesChanged({ changedProps }) {
    const { duration } = changedProps;
    if (duration) {
      // 同步计时器
      this._duration = duration;
    }
  },

  onPlayerPropertiesChanged({ player, changedProps }) {
    cc.log(
      `ui player ${player.userId} changed props: ${JSON.stringify(
        changedProps
      )}`
    );
    const { weight } = changedProps;
    if (weight) {
      // TODO 更新玩家重量
      this._updateList();
    }
  },

  // LIFE-CYCLE CALLBACKS:

  // onLoad () {},

  onDestroy() {
    const client = getClient();
  }
});
