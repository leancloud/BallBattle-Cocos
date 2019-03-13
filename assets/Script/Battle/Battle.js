const LeanCloud = require("../LeanCloud");
const Constants = require("../Constants");
const Ball = require("./Ball");
const PlayerController = require("./PlayerController");
const UI = require("./UI");

const { initClient, getClient } = LeanCloud;
const { Event } = Play;

/**
 * 战斗控制类
 */
cc.Class({
  extends: cc.Component,

  properties: {
    ballTemplate: {
      type: cc.Prefab,
      default: null
    },
    foodTemplate: {
      type: cc.Prefab,
      default: null
    },
    uiNode: {
      type: cc.Node,
      default: null
    },
    sceneCamera: {
      type: cc.Node,
      default: null
    },
    _idToBalls: {
      default: {}
    }
  },

  // LIFE-CYCLE CALLBACKS:

  onLoad() {
    const manager = cc.director.getCollisionManager();
    manager.enabled = true;

    this._ui = this.uiNode.getComponent(UI);
  },

  async start() {
    // 生成食物
    // setInterval(() => {
    //   const food = cc.instantiate(this.foodTemplate);
    //   this.node.addChild(food);
    //   const x = Math.random() * 960 * 2 - 960;
    //   const y = Math.random() * 640 * 2 - 640;
    //   food.position = cc.v2(x, y);
    // }, 1000);
    const userId = `${parseInt(Math.random() * 1000000)}`;
    initClient(userId);
    const client = getClient();
    client.on(Event.PLAYER_ROOM_JOINED, ({ newPlayer }) => {
      // 生成其他玩家
      console.log(`${newPlayer.userId} joined room`);
      const ball = this.newBall(newPlayer.userId, cc.v2(100000, 100000));
      ball.player = newPlayer;
      this._idToBalls[newPlayer.userId] = ball;
    });
    client.on(
      Event.PLAYER_CUSTOM_PROPERTIES_CHANGED,
      ({ player, changedProps }) => {
        console.log(
          `${player.userId} changed props: ${JSON.stringify(changedProps)}`
        );
        if (changedProps.pos) {
          if (!player.isLocal()) {
            const ball = this._idToBalls[player.userId];
            const { x, y } = changedProps.pos;
            ball.node.position = cc.v2(x, y);
          }
        } else if (changedProps.move) {
          if (!player.isLocal()) {
            const ball = this._idToBalls[player.userId];
          }
        }
      }
    );
    try {
      await client.connect();
      cc.log("connect done");
      await client.joinOrCreateRoom("leancloud");
      // 初始化已经在房间的玩家
      client.room.playerList.forEach(player => {
        if (!player.isLocal()) {
          const pos = player.CustomProperties.pos;
          const ball = this.newBall(player.userId, cc.v2(pos.x, pos.y));
          ball.player = player;
          this._idToBalls[player.userId] = ball;
        }
      });
      // 随机生成一个位置
      const pos = this.randomPos();
      // 生成英雄
      const ball = this.newBall(userId, pos);
      ball.player = client.player;
      const playerCtrl = ball.node.addComponent(PlayerController);
      playerCtrl.hero = ball;
      // 设置摄像机跟随
      const cameraNode = cc.find("Canvas/Main Camera");
      cameraNode.removeFromParent();
      ball.node.addChild(cameraNode);
      // 同步位置
      client.player.setCustomProperties({
        pos: { x: pos.x, y: pos.y }
      });
    } catch (err) {
      cc.log(err);
    }
  },

  newBall(userId, pos) {
    const ballNode = cc.instantiate(this.ballTemplate);
    ballNode.position = pos;
    this.node.addChild(ballNode);
    const ball = ballNode.getComponent(Ball);
    ball.userId = userId;
    return ball;
  },

  randomPos() {
    const x = parseInt(Constants.LEFT + Math.random() * Constants.WIDTH);
    const y = parseInt(Constants.BOTTOM + Math.random() * Constants.HEIGHT);
    return cc.v2(x, y);
  }
});
