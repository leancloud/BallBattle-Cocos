/**
 * 食物
 */
cc.Class({
  extends: cc.Component,

  properties: {
    id: 0
  },

  // LIFE-CYCLE CALLBACKS:

  // onLoad () {},

  start() {},

  // update (dt) {},

  getProperties() {
    const { x, y } = this.node.position;
    return {
      id,
      x,
      y
      // 可能还会有能量值
    };
  }
});
