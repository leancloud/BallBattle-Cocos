const LeanCloud = require("../LeanCloud");
const Constants = require("../Constants");
const Ball = require("./Ball");
const Food = require("./Food");
const PlayerController = require("./PlayerController");
const UI = require("./UI");

const { initClient, getClient } = LeanCloud;
const { Event, ReceiverGroup } = Play;

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
    },
    _idToFoods: {
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
    const userId = `${parseInt(Math.random() * 1000000)}`;
    initClient(userId);
    const client = getClient();
    this.initPlayEvent();

    try {
      await client.connect();
      cc.log("connect done");
      await client.joinOrCreateRoom("leancloud");
      // 初始化已经在房间的玩家
      client.room.playerList.forEach(player => {
        if (!player.isLocal()) {
          this.newBall(player);
        }
      });
      // 判断自己是否是 Master，来确定是否需要生成食物
      if (client.player.isMaster()) {
        const roomFoods = [];
        // 只生成数据
        let { roomFoodId } = client.room.CustomProperties;
        if (!roomFoodId) {
          roomFoodId = 0;
        }
        // 暂定初始生成 100 个食物
        for (let i = 0; i < Constants.INIT_FOOD_COUNT; i++) {
          const id = roomFoodId + i;
          const { x, y } = this.randomPos();
          roomFoods.push({ id, x, y });
        }
        roomFoodId += Constants.INIT_FOOD_COUNT;
        // 此时可能导致消息很大
        client.room.setCustomProperties({
          roomFoodId,
          roomFoods
        });
        this.bornPlayer(client.player);
      } else {
        const { roomFoods } = client.room.CustomProperties;
        if (roomFoods) {
          this.spawnFoods(roomFoods);
        }
      }
    } catch (err) {
      cc.log(err);
    }
  },

  initPlayEvent() {
    const client = getClient();
    client.on(Event.PLAYER_ROOM_JOINED, this.onPlayerRoomJoined, this);
    client.on(
      Event.ROOM_CUSTOM_PROPERTIES_CHANGED,
      this.onRoomPropertiesChanged,
      this
    );
    client.on(
      Event.PLAYER_CUSTOM_PROPERTIES_CHANGED,
      this.onPlayerPropertiesChanged,
      this
    );
    client.on(Event.CUSTOM_EVENT, this.onReceiveCustomEvent, this);
  },

  bornPlayer(player) {
    // 为新玩家生成初始数据
    // 通过面积得到体重
    const weight = Math.pow(Constants.BORN_SIZE, 2);
    // 根据体重得到速率
    const speed = Constants.SPEED_FACTOR / weight;
    // 生成随机位置
    const pos = this.randomPos();
    cc.log(`born pos: ${pos}`);
    player.setCustomProperties({ weight, speed, pos });
    // 通知玩家出生
    const options = {
      receiverGroup: ReceiverGroup.All
    };
    const client = getClient();
    client.sendEvent(
      Constants.BORN_EVENT,
      {
        playerId: player.actorId
      },
      options
    );
  },

  newBall(player) {
    const ballNode = cc.instantiate(this.ballTemplate);
    const ball = ballNode.getComponent(Ball);
    ball.init(player);
    this._idToBalls[player.actorId] = ball;
    this.node.addChild(ballNode);
    return ball;
  },

  spawnFoods(roomFoods) {
    cc.log(`spawn ${roomFoods.length} foods`);
    if (roomFoods) {
      roomFoods.forEach(roomFood => {
        const { id, x, y } = roomFood;
        const foodNode = cc.instantiate(this.foodTemplate);
        foodNode.position = cc.v2(x, y);
        this.node.addChild(foodNode);
        const food = foodNode.getComponent(Food);
        food.id = id;
      });
    }
  },

  randomPos() {
    const x = parseInt(Constants.LEFT + Math.random() * Constants.WIDTH);
    const y = parseInt(Constants.BOTTOM + Math.random() * Constants.HEIGHT);
    return cc.v2(x, y);
  },

  // Event
  onPlayerRoomJoined({ newPlayer }) {
    // 生成其他玩家
    console.log(`${newPlayer.userId} joined room`);
    const client = getClient();
    if (client.player.isMaster()) {
      this.bornPlayer(newPlayer);
    }
  },

  onRoomPropertiesChanged({ changedProps }) {
    console.log(`room changed props: ${JSON.stringify(changedProps)}`);
    const { roomFoods } = changedProps;
    if (roomFoods) {
      this.spawnFoods(roomFoods);
    }
  },

  onPlayerPropertiesChanged({ player, changedProps }) {
    cc.log(
      `player ${player.userId} changed props: ${JSON.stringify(changedProps)}`
    );
    const { move } = changedProps;
    if (move) {
      if (!player.isLocal()) {
        // 模拟移动
      }
    }
  },

  onReceiveCustomEvent({ eventId, eventData }) {
    cc.log(`recv: ${eventId}, ${JSON.stringify(eventData)}`);
    const client = getClient();
    if (eventId == Constants.BORN_EVENT) {
      const { playerId } = eventData;
      const player = client.room.getPlayer(playerId);
      const ball = this.newBall(player);
      if (player.isLocal()) {
        // 如果是当前客户端，则增加玩家控制器，摄像机跟随等
        const playerCtrl = ball.node.addComponent(PlayerController);
        playerCtrl.hero = ball;
        // 设置摄像机跟随
        const cameraNode = cc.find("Canvas/Main Camera");
        cameraNode.removeFromParent();
        ball.node.addChild(cameraNode);
      }
    } else if (eventId === Constants.EAT_EVENT) {
      const { bId, fId } = eventData;
      cc.log(`${bId} eat food: ${fId}`);
      const ball = this._idToBalls[bId];
      ball.sync();
    }
  }
});
