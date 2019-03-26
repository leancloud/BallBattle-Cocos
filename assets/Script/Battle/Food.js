/**
 * 食物
 */
cc.Class({
  extends: cc.Component,

  properties: {
    id: 0,
    type: 0
  },

  getProperties() {
    const id = this.id;
    const type = this.type;
    const { x, y } = this.node.position;
    return {
      id,
      type,
      x,
      y
      // 可能还会有能量值
    };
  }
});
