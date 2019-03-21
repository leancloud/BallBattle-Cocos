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

  // LIFE-CYCLE CALLBACKS:

  // onLoad () {},

  start() {
    this.nameLabel.string = this._player.userId;
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
    this.node.dispatchEvent(
      new cc.Event.EventCustom(Constants.BALL_AND_FOOD_COLLISION_EVENT, {
        ball: this,
        food
      })
    );
  },

  onCollideBall(other, self) {
    const { node: b1Node } = other;
    const { node: b2Node } = self;
    this.node.dispatchEvent(
      new cc.Event.EventCustom(Constants.BALL_AND_BALL_COLLISION_EVENT, {
        b1Node,
        b2Node
      })
    );
  },

  getId() {
    return this._player.actorId;
  },

  getSpeed() {
    return this._speed;
  },

  getWeight() {
    const collider = this.node.getComponent(cc.CircleCollider);
    const { radius } = collider;
    const { scaleX, scaleY } = this.node;
    return Constants.PI * Math.pow(radius, 2) * scaleX * scaleY;
  }
});
