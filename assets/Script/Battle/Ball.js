const Constants = require("Constants");
const Food = require("./Food");

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
    }
  },

  init(player) {
    this.player = player;
  },

  eat() {
    // 计算尺寸
    const { weight, pos } = this.player.customProperties;
    const scale = Math.sqrt(weight) / Constants.BORN_SIZE;
    this.node.scale = cc.v2(scale, scale);
  },

  reborn() {
    // 计算尺寸
    const { weight, pos } = this.player.customProperties;
    const scale = Math.sqrt(weight) / Constants.BORN_SIZE;
    this.node.scale = cc.v2(scale, scale);
    // 位置
    const { x, y } = pos;
    this.node.position = cc.v2(x, y);
  },

  // LIFE-CYCLE CALLBACKS:

  // onLoad () {},

  start() {
    this.nameLabel.string = this.player.userId;
  },

  update(dt) {
    const { x, y } = this.node;
    this.infoLabel.string = `(${parseInt(x)}, ${parseInt(y)})`;
  },

  // 碰撞
  onCollisionEnter(other, self) {
    const { group: otherGroup } = other.node;
    if (otherGroup === Constants.FOOD_GROUP) {
      this.onCollideFood(other, self);
    } else if (otherGroup === Constants.BALL_GROUP) {
      this.onCollideBall(other, self);
    }
  },

  onCollideFood(other, self) {
    // 球碰食物，客户端模拟
    const { node: foodNode } = other;
    const { x, y } = self.node.position;
    cc.log(`collide food: (${x}, ${y})`);
    const food = foodNode.getComponent(Food);
    foodNode.active = false;
    // 交由 Master 处理
    const event = new cc.Event.EventCustom(
      Constants.BALL_AND_FOOD_COLLISION_EVENT,
      true
    );
    event.detail = {
      ball: this,
      food
    };
    this.node.dispatchEvent(event);
  },

  onCollideBall(other, self) {
    const { node: b1Node } = other;
    const { node: b2Node } = self;
    const event = new cc.Event.EventCustom(
      Constants.BALL_AND_BALL_COLLISION_EVENT,
      true
    );
    event.detail = {
      b1Node,
      b2Node
    };
    this.node.dispatchEvent(event);
  },

  getId() {
    return this.player.actorId;
  },

  getSpeed() {
    const { speed } = this.player.customProperties;
    return speed;
  },

  getWeight() {
    const collider = this.node.getComponent(cc.CircleCollider);
    const { radius } = collider;
    const { scaleX, scaleY } = this.node;
    return Constants.PI * Math.pow(radius, 2) * scaleX * scaleY;
  }
});
