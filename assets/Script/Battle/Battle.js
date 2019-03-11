/**
 * 战斗控制类
 */
cc.Class({
  extends: cc.Component,

  properties: {
    foodTemplate: {
      type: cc.Prefab,
      default: null
    }
  },

  // LIFE-CYCLE CALLBACKS:

  onLoad() {
    const manager = cc.director.getCollisionManager();
    manager.enabled = true;
  },

  start() {
    setInterval(() => {
      const food = cc.instantiate(this.foodTemplate);
      this.node.addChild(food);
      const x = Math.random() * 960 - 480;
      const y = Math.random() * 640 - 320;
      food.position = cc.v2(x, y);
    }, 1000);
  }

  // update (dt) {},
});
