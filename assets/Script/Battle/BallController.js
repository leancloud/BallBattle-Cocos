const Ball = require("Ball");
const Constants = require("../Constants");
const LeanCloud = require("../LeanCloud");

const { getClient } = LeanCloud;

/**
 * 球控制器，当前客户端需要添加组件，由用户输入直接移动，并触发移动同步
 */
cc.Class({
  extends: cc.Component,

  properties: {},

  // LIFE-CYCLE CALLBACKS:

  onLoad() {
    cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    this._ball = this.node.getComponent(Ball);
    this._direction = cc.Vec2.ZERO;
  },

  onDestroy() {
    cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
  },

  start() {
    this._cameraNode = cc.find("Canvas/Main Camera");
  },

  update(dt) {
    const speed = this._ball.getSpeed();
    const delta = this._direction.normalize().mul(speed * dt);
    const position = this.node.position.add(delta);
    const { x, y } = position;
    const { LEFT, RIGHT, TOP, BOTTOM } = Constants;
    const newPosition = cc.v2(
      Math.min(Math.max(x, LEFT), RIGHT),
      Math.min(Math.max(y, BOTTOM), TOP)
    );
    this.node.position = newPosition;
    // 设置摄像机跟随
    this._cameraNode.position = this.node.position;
  },

  onKeyDown(event) {
    this.running = true;
    let dir = this._direction.clone();
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
    this.synchMove(dir.normalize());
  },

  onKeyUp(event) {
    let dir = this._direction.clone();
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
    this.synchMove(dir.normalize());
  },

  synchMove(dir) {
    if (dir.fuzzyEquals(this._direction, 0.01)) {
      return;
    }
    this._direction = dir;
    const { x, y } = this.node.position;
    const { x: dx, y: dy } = this._direction;
    const client = getClient();
    client.player.setCustomProperties({
      move: { p: { x, y }, d: { x: dx, y: dy }, t: Date.now() }
    });
  }
});
