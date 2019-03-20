const Constants = require("Constants");
const LeanCloud = require("../LeanCloud");
const Food = require("./Food");
const { randomPos } = require("./BattleHelper");

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
    const client = getClient();
    // 球碰食物，客户端模拟
    const { node: foodNode } = other;
    const { x, y } = self.node.position;
    cc.log(`collide food: (${x}, ${y})`);
    const food = foodNode.getComponent(Food);
    foodNode.active = false;
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
  },

  onCollideBall(other, self) {
    const client = getClient();
    // 球碰球
    if (client.player.isMaster) {
      // 比较两个球的体重，体重大者获胜
      const { node: otherNode } = other;
      const { node: selfNode } = self;
      cc.log(`${otherNode.name}, ${selfNode.name}`);
      const otherBall = otherNode.getComponent("Ball");
      const selfBall = selfNode.getComponent("Ball");
      const otherPlayer = client.room.getPlayer(otherBall.getId());
      const selfPlayer = client.room.getPlayer(selfBall.getId());
      const { weight: otherWeight } = otherPlayer.customProperties;
      const { weight: selfWeight } = selfPlayer.customProperties;
      let winner, loser;
      if (otherWeight > selfWeight) {
        // 对方胜利
        winner = otherPlayer;
        loser = selfPlayer;
      } else {
        // 己方胜利
        winner = selfPlayer;
        loser = otherPlayer;
      }
      // 通知胜利者
      const { actorId: winnerId } = winner;
      const { actorId: loserId } = loser;
      const winnerWeight = otherWeight + selfWeight;
      const winnerSpeed = Constants.SPEED_FACTOR / winnerWeight;
      client.sendEvent(Constants.KILL_EVENT, { winnerId, loserId });
      winner.setCustomProperties({ winnerWeight, winnerSpeed });
      // 重置失败者
      // 通过面积得到体重
      const loserWeight = Math.pow(Constants.BORN_SIZE, 2);
      // 根据体重得到速率
      const loserSpeed = Constants.SPEED_FACTOR / loserWeight;
      // 生成随机位置
      const pos = randomPos();
      cc.log(`born pos: ${pos}`);
      loser.setCustomProperties({
        pos,
        weight: loserWeight,
        speed: loserSpeed
      });
    }
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
