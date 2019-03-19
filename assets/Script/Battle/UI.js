const LeanCloud = require("../LeanCloud");
const PlayerInfoItem = require("./PlayerInfoItem");

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
    }
  },

  initPlay() {
    this._playerInfoItems = [];
    const client = getClient();
    client.on(Event.PLAYER_ROOM_JOINED, this.onPlayerRoomJoined, this);
    client.on(Event.PLAYER_ROOM_LEFT, this.onPlayerRoomLeft, this);
    client.on(
      Event.PLAYER_CUSTOM_PROPERTIES_CHANGED,
      this.onPlayerPropertiesChanged,
      this
    );
    const playerList = client.room.playerList;
    playerList.forEach(p => {
      this._newPlayerInfoItem(p);
    });
    this._updateList();
  },

  _newPlayerInfoItem(player) {
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

  onPlayerRoomJoined({ newPlayer }) {
    // 生成其他玩家
    this._newPlayerInfoItem(newPlayer);
    this._updateList();
  },

  onPlayerRoomLeft() {
    const playerInfoItem = this._playerInfoItems.pop();
    this.playerInfoListNode.removeChild(playerInfoItem.node);
    this._updateList();
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
    client.off(Event.PLAYER_ROOM_JOINED, this.onPlayerRoomJoined);
    client.off(Event.PLAYER_ROOM_LEFT, this.onPlayerRoomLeft);
    client.off(
      Event.Event.PLAYER_CUSTOM_PROPERTIES_CHANGED,
      this.onPlayerPropertiesChanged
    );
  }
});
