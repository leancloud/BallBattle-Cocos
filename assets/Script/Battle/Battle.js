const LeanCloud = require("../LeanCloud");
const Constants = require("../Constants");
const Ball = require("./Ball");
const UI = require("./UI");
const FoodSpawner = require("./FoodSpawner");

const Master = require("./Master");
const BallController = require("./BallController");
const BallSimulator = require("./BallSimulator");

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
    foodSpawner: {
      type: FoodSpawner,
      default: null
    },
    ui: {
      type: UI,
      default: null
    },
    sceneCamera: {
      type: cc.Node,
      default: null
    }
  },

  // LIFE-CYCLE CALLBACKS:

  onLoad() {
    this._idToBalls = {};
    const manager = cc.director.getCollisionManager();
    manager.enabled = true;
  },

  async start() {
    const userId = `${parseInt(Math.random() * 1000000)}`;
    initClient(userId);
    const client = getClient();

    try {
      await client.connect();
      cc.log("connect done");
      await client.joinOrCreateRoom("leancloud");
      this.initPlayEvent();
      if (client.player.isMaster) {
        this._master = this.node.addComponent(Master);
      }
      this.foodSpawner.initPlay();
      this.ui.initPlay();
    } catch (err) {
      cc.log(err);
    }
  },

  initPlayEvent() {
    const client = getClient();
    client.on(Event.CUSTOM_EVENT, this.onCustomEvent, this);
  },

  startTimer() {
    this._duration = Constants.GAME_DURATION;
  },

  newBall(player) {
    const ballNode = cc.instantiate(this.ballTemplate);
    const { x, y } = player.customProperties.pos;
    ballNode.position = cc.v2(x, y);
    const ball = ballNode.getComponent(Ball);
    ball.init(player);
    this._idToBalls[player.actorId] = ball;
    this.node.addChild(ballNode);
    return ball;
  },

  // Event

  onCustomEvent({ eventId, eventData }) {
    cc.log(`recv: ${eventId}, ${JSON.stringify(eventData)}`);
    if (eventId == Constants.BORN_EVENT) {
      this.onBornEvent(eventData);
    } else if (eventId === Constants.EAT_EVENT) {
      this.onEatEvent(eventData);
    } else if (eventId === Constants.KILL_EVENT) {
      this.onKillEvent(eventData);
    } else if (eventId == Constants.REBORN_EVENT) {
      this.onRebornEvent(eventData);
    } else if (eventId == Constants.PLAYER_LEFT_EVENT) {
      this.onPlayerLeftEvent(eventData);
    }
  },

  // Custom Events

  onBornEvent(eventData) {
    const client = getClient();
    const { playerId } = eventData;
    const player = client.room.getPlayer(playerId);
    if (player.isLocal) {
      this.ui.startTimer();
      // 初始化已经在房间的玩家
      client.room.playerList.forEach(p => {
        const ball = this.newBall(p);
        if (p.isLocal) {
          // 如果是当前客户端，则增加玩家控制器，摄像机跟随等
          ball.addComponent(BallController);
        }
      });
    } else {
      const ball = this.newBall(player);
      ball.addComponent(BallSimulator);
    }
  },

  onEatEvent(eventData) {
    const { bId, fId } = eventData;
    cc.log(`${bId} eat food: ${fId}`);
    const ball = this._idToBalls[bId];
    ball.sync();
  },

  onKillEvent(eventData) {
    const { loserId } = eventData;
    // 杀死 Ball，将失败者的 node 设置为不活跃，也许需要等待用户点击复活
    const ball = this._idToBalls[loserId];
    ball.node.active = false;
  },

  onRebornEvent(eventData) {
    const { playerId } = eventData;
    const ball = this._idToBalls[playerId];
    ball.node.active = true;
    const client = getClient();
    const player = client.room.getPlayer(playerId);
    ball.init(player);
  },

  onPlayerLeftEvent(eventData) {
    const { playerId } = eventData;
    const ball = this._idToBalls[playerId];
    this.node.removeChild(ball.node);
  }
});
