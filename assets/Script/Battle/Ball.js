const Constants = require("Constants");
/**
 * 球
 */
cc.Class({
  extends: cc.Component,

  properties: {
    nameLabel: {
      type: cc.Label,
      default: null
    },
    infoLabel: {
      type: cc.Label,
      default: null
    },
    userId: "",
    player: null
  },

  // LIFE-CYCLE CALLBACKS:

  // onLoad () {},

  start() {
    this.nameLabel.string = this.userId;
  },

  update(dt) {
    // this.infoLabel.string = `w: ${parseInt(this.weight())}, s: ${parseInt(
    //   this.speed()
    // )}`;
    const { x, y } = this.node;
    this.infoLabel.string = `(${parseInt(x)}, ${parseInt(y)})`;
    if (!this.player.isLocal()) {
      // 如果不是当前客户端，则模拟运动
      const move = this.player.CustomProperties.move;
      if (move) {
        // 模拟计算当前应该所处位置
        const now = Date.now();
        let delta = now - move.t;
        const start = cc.v2(move.p.x, move.p.y);
        let direction = cc.v2(move.d.x, move.d.y).normalize();
        const end = start.add(direction.mul(this.speed() * delta));
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
        delta = direction.mul(this.speed() * dt);
        // 计算当前新的位置
        const newPosition = curPos.add(delta);
        this.node.position = newPosition;
      }
    }
  },

  // 物理
  onCollisionEnter(other, self) {
    // const { width, height, scaleX, scaleY } = this.node;
    // const area = width * scaleX * height * scaleY;
    // const newArea = area + 800;
    // const newScale = Math.sqrt(newArea / (width * height));
    // this.node.scale = cc.v2(newScale, newScale);
    // // TODO 对象池
    // other.node.destroy();
  },

  weight() {
    const { width, height, scaleX, scaleY } = this.node;
    return width * scaleX * height * scaleY;
  },

  speed() {
    const speed = Constants.SpeedFactor / this.weight();
    return Math.max(Constants.MinSpeed, speed);
  }
});
