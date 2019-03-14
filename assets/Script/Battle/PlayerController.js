const Ball = require("Ball");
const Constants = require("../Constants");
const LeanCloud = require("../LeanCloud");

const { getClient } = LeanCloud;

/**
 * 玩家控制器
 */
cc.Class({
  extends: cc.Component,

  properties: {
    hero: {
      type: Ball,
      default: null
    },
    // 移动速度
    speed: 100,
    direction: cc.Vec2.ZERO,
    running: false
  },

  // LIFE-CYCLE CALLBACKS:

  onLoad() {
    cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
  },

  onDestroy() {
    cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
  },

  start() {},

  update(dt) {
    if (!this.running) {
      return;
    }
    const speed = this.hero.speed();
    const delta = this.direction.normalize().mul(speed * dt);
    const heroNode = this.hero.node;
    const position = heroNode.position.add(delta);
    const { x, y } = position;
    const { LEFT, RIGHT, TOP, BOTTOM } = Constants;
    const newPosition = cc.v2(
      Math.min(Math.max(x, LEFT), RIGHT),
      Math.min(Math.max(y, BOTTOM), TOP)
    );
    heroNode.position = newPosition;
  },

  onKeyDown(event) {
    this.running = true;
    let dir = this.direction.clone();
    switch (event.keyCode) {
      case cc.macro.KEY.a:
      case cc.macro.KEY.left:
        dir.x = -1;
        break;
      case cc.macro.KEY.d:
      case cc.macro.KEY.right:
        dir.x = 1;
        break;
      case cc.macro.KEY.w:
      case cc.macro.KEY.up:
        dir.y = 1;
        break;
      case cc.macro.KEY.s:
      case cc.macro.KEY.down:
        dir.y = -1;
        break;
      default:
        break;
    }
    this.synchMove(dir);
  },

  onKeyUp(event) {
    let dir = this.direction.clone();
    switch (event.keyCode) {
      case cc.macro.KEY.a:
      case cc.macro.KEY.left:
      case cc.macro.KEY.d:
      case cc.macro.KEY.right:
        dir.x = 0;
        break;
      case cc.macro.KEY.w:
      case cc.macro.KEY.up:
      case cc.macro.KEY.s:
      case cc.macro.KEY.down:
        dir.y = 0;
        break;
      default:
        break;
    }
    this.synchMove(dir);
  },

  synchMove(dir) {
    if (dir.fuzzyEquals(this.direction, 0.01)) {
      return;
    }
    this.direction = dir;
    const { x, y } = this.node.position;
    const { x: dx, y: dy } = this.direction;
    const client = getClient();
    client.player.setCustomProperties({
      move: { p: { x, y }, d: { x: dx, y: dy }, t: Date.now() }
    });
  }
});
