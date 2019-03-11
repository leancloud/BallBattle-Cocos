cc.Class({
  extends: cc.Component,

  properties: {
    label: {
      default: null,
      type: cc.Label
    },
    sprite: {
      default: null,
      type: cc.Sprite
    },
    // defaults, set visually when attaching this script to the Canvas
    text: "Hello, World!",
    // 移动速度
    speed: 100,
    direction: cc.v2(1, 0),
    running: false
  },

  // use this for initialization
  onLoad() {
    this.label.string = this.text;
    cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
  },

  onDestroy() {
    cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
  },

  // called every frame
  update(dt) {
    if (!this.running) {
      return;
    }
    const delta = this.direction.mul(this.speed * dt);
    const spriteNode = this.sprite.node;
    spriteNode.position = spriteNode.position.add(delta);
  },

  onKeyDown(event) {
    this.running = true;
    switch (event.keyCode) {
      case cc.macro.KEY.a:
      case cc.macro.KEY.left:
        this.direction.x = -1;
        break;
      case cc.macro.KEY.d:
      case cc.macro.KEY.right:
        this.direction.x = 1;
        break;
      case cc.macro.KEY.w:
      case cc.macro.KEY.up:
        this.direction.y = 1;
        break;
      case cc.macro.KEY.s:
      case cc.macro.KEY.down:
        this.direction.y = -1;
        break;
      default:
        break;
    }
  },

  onKeyUp(event) {
    switch (event.keyCode) {
      case cc.macro.KEY.a:
      case cc.macro.KEY.left:
        this.direction.x = 0;
        break;
      case cc.macro.KEY.d:
      case cc.macro.KEY.right:
        this.direction.x = 0;
        break;
      case cc.macro.KEY.w:
      case cc.macro.KEY.up:
        this.direction.y = 0;
        break;
      case cc.macro.KEY.s:
      case cc.macro.KEY.down:
        this.direction.y = 0;
        break;
      default:
        break;
    }
  }
});
