/**
 * 摄像机控制器
 */
cc.Class({
  extends: cc.Component,

  properties: {
    targetNode: {
      type: cc.Node,
      default: null
    }
  },

  // LIFE-CYCLE CALLBACKS:

  // onLoad () {},

  start() {},

  update(dt) {
    this.node.position = this.targetNode.position;
  }
});
