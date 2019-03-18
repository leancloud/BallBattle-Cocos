const Constants = require("Constants");
const LeanCloud = require("../LeanCloud");
const Food = require("./Food");

const { getClient } = LeanCloud;
const { ReceiverGroup } = Play;

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
    _player: null,
    _speed: 0
  },

  init(player) {
    this._player = player;
    this.sync();
    const { pos } = this._player.customProperties;
    const { x, y } = pos;
    cc.log(`sync pos: ${x}, ${y}`);
    this.node.position = cc.v2(x, y);
  },

  /**
   * 从 Player Properties 中同步属性
   */
  sync() {
    // 计算尺寸
    const { weight, speed } = this._player.customProperties;
    const scale = Math.sqrt(weight) / Constants.BORN_SIZE;
    this.node.scale = cc.v2(scale, scale);
    this._speed = speed;
  },

  // LIFE-CYCLE CALLBACKS:

  // onLoad () {},

  start() {
    this.nameLabel.string = this._player.userId;
  },

  update(dt) {
    const { x, y } = this.node;
    this.infoLabel.string = `(${parseInt(x)}, ${parseInt(y)})`;
    if (!this._player.isLocal) {
      // 如果不是当前客户端，则模拟运动
      const move = this._player.customProperties.move;
      if (move) {
        // 模拟计算当前应该所处位置
        const now = Date.now();
        let delta = now - move.t;
        const start = cc.v2(move.p.x, move.p.y);
        let direction = cc.v2(move.d.x, move.d.y).normalize();
        const end = start.add(direction.mul(this._speed * delta));
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
        delta = direction.mul(this._speed * dt);
        // 计算当前新的位置
        const newPosition = curPos.add(delta);
        this.node.position = newPosition;
      }
    }
  },

  // 物理
  onCollisionEnter(other, self) {
    if (other.node.group === Constants.FOOD_GROUP) {
      const { node: foodNode } = other;
      const food = foodNode.getComponent(Food);
      const client = getClient();
      if (client.player.isMaster) {
        // Master 用来处理逻辑同步
        // 同步玩家属性：体重和速度
        let { weight } = this._player.customProperties;
        weight += Constants.FOOD_WEIGHT;
        const speed = Constants.SPEED_FACTOR / weight;
        this._player.setCustomProperties({ weight, speed });
        // 通知吃食物的事件
        const options = {
          receiverGroup: ReceiverGroup.All
        };
        const bId = this.getId();
        const fId = food.id;
        client.sendEvent(Constants.EAT_EVENT, { bId, fId }, options);
      }
      foodNode.active = false;
    }
    // const { width, height, scaleX, scaleY } = this.node;
    // const area = width * scaleX * height * scaleY;
    // const newArea = area + 800;
    // const newScale = Math.sqrt(newArea / (width * height));
    // this.node.scale = cc.v2(newScale, newScale);
    // // TODO 对象池
    // other.node.destroy();
  },

  getId() {
    return this._player.actorId;
  },

  getSpeed() {
    return this._speed;
  }
});
