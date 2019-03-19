/**
 * 玩家信息组
 */
cc.Class({
  extends: cc.Component,

  properties: {
    rankLabel: {
      type: cc.Label,
      default: null
    },
    nameLabel: {
      type: cc.Label,
      default: null
    },
    weightLabel: {
      type: cc.Label,
      default: null
    }
  },

  setInfo(rank, name, weight) {
    this.rankLabel.string = `${rank}`;
    this.nameLabel.string = `${name}`;
    this.weightLabel.string = `${weight}`;
  }
});
