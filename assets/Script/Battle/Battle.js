const LeanCloud = require("../LeanCloud");
const Constants = require("../Constants");
const Ball = require("./Ball");
const UI = require("./UI");
const Food = require("./Food");

const Master = require("./Master");
const BallController = require("./BallController");
const BallSimulator = require("./BallSimulator");

const { getClient } = LeanCloud;
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
    foodTempleteList: {
      type: cc.Prefab,
      default: []
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
    this._idToFoods = {};
    const manager = cc.director.getCollisionManager();
    manager.enabled = true;
  },

  start() {
    const client = getClient();
    cc.log(`client: ${client}`);
    client.on(Event.MASTER_SWITCHED, this.onMasterSwitched, this);
    client.on(Event.CUSTOM_EVENT, this.onCustomEvent, this);
    cc.log(`register: ${Event.MASTER_SWITCHED}, ${Event.CUSTOM_EVENT}`);
    if (client.player.isMaster) {
      const master = this.node.addComponent(Master);
      master.init();
    }
    cc.log("resume message queue");
    client.resumeMessageQueue();
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

  spawnFoodNodes() {
    const client = getClient();
    const { roomFoods } = client.room.customProperties;
    cc.log(`spawn ${roomFoods.length} foods`);
    if (roomFoods) {
      roomFoods.forEach(roomFood => {
        const { id, type, x, y } = roomFood;
        if (this._idToFoods[id]) {
          return;
        }
        const foodNode = cc.instantiate(this.foodTempleteList[type]);
        foodNode.position = cc.v2(x, y);
        this.node.addChild(foodNode);
        const food = foodNode.getComponent(Food);
        food.id = id;
        food.type = type;
        this._idToFoods[id] = food;
      });
    }
  },

  // Event

  onMasterSwitched({ newMaster }) {
    if (newMaster.isLocal) {
      cc.log("I am the new master");
      const master = this.node.addComponent(Master);
      master.switch();
    }
  },

  onCustomEvent({ eventId, eventData }) {
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
    } else if (eventId == Constants.SPAWN_FOOD_EVENT) {
      this.spawnFoodNodes();
    }
  },

  // Custom Events

  onBornEvent(eventData) {
    const client = getClient();
    // 初始化战场
    this.spawnFoodNodes();
    const { playerId } = eventData;
    const player = client.room.getPlayer(playerId);
    if (player.isLocal) {
      // 如果是当前客户端，表示游戏开始
      this.ui.initUI();
      // 初始化已经在房间的玩家
      client.room.playerList.forEach(p => {
        const ball = this.newBall(p);
        if (p.isLocal) {
          // 如果是当前客户端，则增加玩家控制器，摄像机跟随等
          ball.addComponent(BallController);
        } else {
          // 如果是其他客户端，则增加玩家模拟器
          ball.addComponent(BallSimulator);
        }
      });
    } else {
      // 如果不是当前客户端，表示有其他玩家加入了游戏
      const ball = this.newBall(player);
      ball.addComponent(BallSimulator);
      this.ui.addPlayerInfoItem();
    }
  },

  onEatEvent(eventData) {
    const { bId, fId } = eventData;
    cc.log(`${bId} eat food: ${fId}`);
    const ball = this._idToBalls[bId];
    ball.eat();
    const food = this._idToFoods[fId];
    this.node.removeChild(food.node);
    delete this._idToFoods[fId];
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
    ball.reborn();
  },

  onPlayerLeftEvent(eventData) {
    const { playerId } = eventData;
    const ball = this._idToBalls[playerId];
    this.node.removeChild(ball.node);
    this.ui.removePlayerInfoItem();
  }
});
