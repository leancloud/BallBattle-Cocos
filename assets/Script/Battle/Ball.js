/**
 * 球
 */
cc.Class({
  extends: cc.Component,

  properties: {},

  // LIFE-CYCLE CALLBACKS:

  // onLoad () {},

  start() {},

  // update (dt) {},

  // 物理
  onCollisionEnter(other, self) {
    const { width, height, scaleX, scaleY } = this.node;
    const area = width * scaleX * height * scaleY;
    const newArea = area + 800;
    const newScale = Math.sqrt(newArea / (width * height));
    cc.log(`new scale: ${newScale}`);
    this.node.scale = cc.v2(newScale, newScale);
    // TODO 对象池
    other.node.destroy();
  }
});
