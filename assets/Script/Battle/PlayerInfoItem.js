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

  setInfo(rank, player) {
    let color = cc.Color.WHITE;
    if (player.isLocal) {
      color = cc.Color.YELLOW;
    }
    this.rankLabel.node.color = color;
    this.nameLabel.node.color = color;
    this.weightLabel.node.color = color;
    this.rankLabel.string = `${rank}`;
    this.nameLabel.string = `${player.userId}`;
    const { weight } = player.customProperties;
    this.weightLabel.string = this.toReadableWeight(weight);
  },

  toReadableWeight(weight) {
    if (weight < 1000) {
      return weight;
    } else if (weight < 1000000) {
      const w = new Number(weight / 1000);
      return `${w.toFixed(1)}k`;
    } else {
      const w = new Number(weight / 1000 / 1000);
      return `${w.toFixed(1)}m`;
    }
  }
});
