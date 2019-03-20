const LeanCloud = require("../LeanCloud");
const Constants = require("../Constants");
const Ball = require("./Ball");
const PlayerController = require("./PlayerController");
const UI = require("./UI");
const FoodSpawner = require("./FoodSpawner");
const { randomPos } = require("./BattleHelper");

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
    this.initPlayEvent();

    try {
      await client.connect();
      cc.log("connect done");
      await client.joinOrCreateRoom("leancloud");
      this.foodSpawner.initPlay();
      this.ui.initPlay();
      // 初始化已经在房间的玩家
      client.room.playerList.forEach(player => {
        if (!player.isLocal) {
          this.newBall(player);
        }
      });
      // 判断自己是否是 Master，来确定是否需要生成食物
      if (client.player.isMaster) {
        cc.log("I am master");
        this.startTimer();
        this.foodSpawner.spawnFoodsData(Constants.INIT_FOOD_COUNT);
        this.bornPlayer(client.player);
      } else {
        this.foodSpawner.spawnFoodNodes();
      }
    } catch (err) {
      cc.log(err);
    }
  },

  initPlayEvent() {
    const client = getClient();
    client.on(Event.PLAYER_ROOM_JOINED, this.onPlayerRoomJoined, this);
    client.on(Event.PLAYER_ROOM_LEFT, this.onPlayerRoomLeft, this);
    client.on(
      Event.PLAYER_CUSTOM_PROPERTIES_CHANGED,
      this.onPlayerPropertiesChanged,
      this
    );
    client.on(Event.CUSTOM_EVENT, this.onCustomEvent, this);
  },

  startTimer() {
    this._duration = Constants.GAME_DURATION;
    setInterval(() => {
      this._duration--;
    }, 1000);
  },

  bornPlayer(player) {
    // 为新玩家生成初始数据
    // 通过面积得到体重
    const weight = Math.pow(Constants.BORN_SIZE, 2);
    // 根据体重得到速率
    const speed = Constants.SPEED_FACTOR / weight;
    // 生成随机位置
    const pos = randomPos();
    cc.log(`born pos: ${pos}`);
    player.setCustomProperties({ weight, speed, pos });
    // 通知玩家出生
    const client = getClient();
    // 设置房间时间
    client.room.setCustomProperties({ duration: this._duration });
    client.sendEvent(Constants.BORN_EVENT, {
      playerId: player.actorId
    });
  },

  newBall(player) {
    const ballNode = cc.instantiate(this.ballTemplate);
    const ball = ballNode.getComponent(Ball);
    ball.init(player);
    this._idToBalls[player.actorId] = ball;
    this.node.addChild(ballNode);
    return ball;
  },

  // Event
  onPlayerRoomJoined({ newPlayer }) {
    // 生成其他玩家
    console.log(`${newPlayer.userId} joined room`);
    const client = getClient();
    if (client.player.isMaster) {
      this.bornPlayer(newPlayer);
    }
  },

  onPlayerRoomLeft({ leftPlayer }) {
    // 删除玩家
    console.log(`${leftPlayer.userId} left room`);
    const ball = this._idToBalls[leftPlayer.actorId];
    this.node.removeChild(ball.node);
  },

  onPlayerPropertiesChanged({ player, changedProps }) {
    cc.log(
      `battle player ${player.userId} changed props: ${JSON.stringify(
        changedProps
      )}`
    );
    const { move } = changedProps;
    if (move) {
      if (!player.isLocal) {
        // 模拟移动
      }
    }
  },

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
    }
  },

  // Custom Events

  onBornEvent(eventData) {
    const client = getClient();
    const { playerId } = eventData;
    const player = client.room.getPlayer(playerId);
    const ball = this.newBall(player);
    if (player.isLocal) {
      // 如果是当前客户端，则增加玩家控制器，摄像机跟随等
      const playerCtrl = ball.node.addComponent(PlayerController);
      playerCtrl.hero = ball;
      // 设置摄像机跟随
      const cameraNode = cc.find("Canvas/Main Camera");
      cameraNode.removeFromParent();
      ball.node.addChild(cameraNode);
      this.ui.startTimer();
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
  }
});
