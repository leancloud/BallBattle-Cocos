const Ball = require("Ball");
const Constants = require("../Constants");

/**
 * 球模拟器，其他客户端需要添加组件，用于同步其他客户端的运动行为
 */
cc.Class({
  extends: cc.Component,

  properties: {},

  init(player) {
    this._player = player;
  },

  // LIFE-CYCLE CALLBACKS:

  onLoad() {
    this._ball = this.node.getComponent(Ball);
  },

  start() {
    const player = this._ball.player;
    const { pos } = player.customProperties;
    const { x, y } = pos;
    cc.log(`sync pos: ${x}, ${y}`);
    this.node.position = cc.v2(x, y);
    const { weight, speed } = player.customProperties;
    const scale = Math.sqrt(weight) / Constants.BORN_SIZE;
    this.node.scale = cc.v2(scale, scale);
    this._speed = speed;
  },

  update(dt) {
    const { move, speed } = this._ball.player.customProperties;
    if (move) {
      // 模拟计算当前应该所处位置
      const now = Date.now();
      let delta = now - move.t;
      const start = cc.v2(move.p.x, move.p.y);
      let direction = cc.v2(move.d.x, move.d.y).normalize();
      const end = start.add(direction.mul(speed * delta));
      // 计算当前位置到「应该位置」的方向
      const { x, y } = this.node.position;
      const curPos = cc.v2(x, y);
      const mag = end.sub(curPos).mag();
      if (mag < Constants.DISTANCE_MAG) {
        // 如果目标位置和当前位置在允许误差内，则不再移动
        return;
      }
      // 计算出校正后的方向
      direction = end.sub(curPos).normalize();
      // 计算出校正后的方向偏移
      delta = direction.mul(speed * dt);
      // 计算当前新的位置
      let newPosition = curPos.add(delta);
      const { x: nx, y: ny } = newPosition;
      const { LEFT, RIGHT, TOP, BOTTOM } = Constants;
      newPosition = cc.v2(
        Math.min(Math.max(nx, LEFT), RIGHT),
        Math.min(Math.max(ny, BOTTOM), TOP)
      );
      this.node.position = newPosition;
    }
  }
});
