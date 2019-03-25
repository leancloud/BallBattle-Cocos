const LeanCloud = require("../LeanCloud");
const Constants = require("../Constants");
const { randomPos } = require("./BattleHelper");

const { getClient } = LeanCloud;
const { Event } = Play;

/**
 * 游戏逻辑控制器
 * 处理 SDK 事件，转换成新的自定义事件同步给客户端
 */
cc.Class({
  extends: cc.Component,

  properties: {},

  // LIFE-CYCLE CALLBACKS:

  onLoad() {
    cc.log("I am master");
    this._idToFoods = {};
    const client = getClient();
    //
    client.on(Event.PLAYER_ROOM_JOINED, this.onPlayerRoomJoined, this);
    client.on(Event.PLAYER_ROOM_LEFT, this.onPlayerRoomLeft, this);
    //
    this.node.on(
      Constants.BALL_AND_FOOD_COLLISION_EVENT,
      this.onBallAndFoodCollision,
      this
    );
    this.node.on(
      Constants.BALL_AND_BALL_COLLISION_EVENT,
      this.onBallAndBallCollision,
      this
    );
  },

  init() {
    const client = getClient();
    const duration = Constants.GAME_DURATION;
    client.room.setCustomProperties({ duration });
    setInterval(() => {
      this._duration--;
    }, 1000);
    this.spawnFoodsData(Constants.INIT_FOOD_COUNT);
    // 补充食物
    setInterval(() => {
      const fIds = Object.keys(this._idToFoods);
      const spawnFoodCount = Constants.INIT_FOOD_COUNT - fIds.length;
      cc.log(`respawn: ${spawnFoodCount}`);
      this.spawnFoodsData(spawnFoodCount);
    }, Constants.SPAWN_FOOD_DURATION);
    // 生成自己的玩家数据
    this.newPlayer(client.player);
  },

  switch() {
    const client = getClient();
    let { duration } = client.room.customProperties;
    client.room.setCustomProperties({ duration });
    setInterval(() => {
      this._duration--;
    }, 1000);
    // 同步食物，保存至服务端的 Room Properties 中
    setInterval(() => {
      const foods = Object.values(this._idToFoods);
      console.log(`current foods count: ${foods.length}`);
      const roomFoods = [];
      foods.forEach(f => {
        const { id, type } = f;
        const { x, y } = f;
        roomFoods.push({
          id,
          type,
          x,
          y
        });
      });
      client.room.setCustomProperties({
        roomFoods
      });
    }, Constants.SYNC_FOOD_DURATION);
    // 补充食物
    setInterval(() => {
      const fIds = Object.keys(this._idToFoods);
      const spawnFoodCount = Constants.INIT_FOOD_COUNT - fIds.length;
      cc.log(`respawn: ${spawnFoodCount}`);
      this.spawnFoodsData(spawnFoodCount);
    }, Constants.SPAWN_FOOD_DURATION);
  },

  newPlayer(player) {
    cc.log(`new player: ${player.userId}`);
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

  /**
   * 生成食物数据
   * @param {Number} count
   */
  spawnFoodsData(count) {
    const client = getClient();
    // 只生成数据
    let { roomFoodId } = client.room.customProperties;
    roomFoodId = roomFoodId || 0;
    // 暂定初始生成 100 个食物
    for (let i = 0; i < count; i++) {
      const id = roomFoodId + i;
      const type = parseInt(Math.random() * 1000000) % 3;
      const { x, y } = randomPos();
      this._idToFoods[id] = { id, type, x, y };
    }
    roomFoodId += count;
    const roomFoods = Object.values(this._idToFoods);
    // 此时可能导致消息很大
    client.room.setCustomProperties({
      roomFoodId,
      roomFoods
    });
  },

  // Cocos Events
  onBallAndFoodCollision(event) {
    const { ball, food } = event.detail;
    // 移除 food
    delete this._idToFoods[food.id];
    // Master 用来处理逻辑同步
    // 同步玩家属性：体重和速度
    const { player } = ball;
    let { weight } = player.customProperties;
    weight += Constants.FOOD_WEIGHT;
    const speed = Constants.SPEED_FACTOR / weight;
    player.setCustomProperties({ weight, speed });
    // 通知吃食物的事件
    const { actorId: bId } = player;
    const { id: fId } = food;
    const client = getClient();
    client.sendEvent(Constants.EAT_EVENT, { bId, fId });
  },

  onBallAndBallCollision(event) {
    const client = getClient();
    const { b1Node, b2Node } = event.detail;
    // 比较两个球的体重，体重大者获胜
    cc.log(`${b1Node.name}, ${b2Node.name}`);
    const ball1 = b1Node.getComponent("Ball");
    const ball2 = b2Node.getComponent("Ball");
    const b1Player = client.room.getPlayer(ball1.getId());
    const b2Player = client.room.getPlayer(ball2.getId());
    const { weight: otherWeight } = b1Player.customProperties;
    const { weight: selfWeight } = b2Player.customProperties;
    let winner, loser;
    if (otherWeight > selfWeight) {
      // 对方胜利
      winner = b1Player;
      loser = b2Player;
    } else {
      // 己方胜利
      winner = b2Player;
      loser = b1Player;
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
      speed: loserSpeed,
      move: null
    });
    client.sendEvent(Constants.REBORN_EVENT, { playerId: loserId });
  },

  // Play Events
  // 玩家加入房间
  onPlayerRoomJoined({ newPlayer }) {
    cc.log("new player joined");
    // 生成其他玩家
    cc.log(`${newPlayer.userId} joined room`);
    this.newPlayer(newPlayer);
  },

  // 玩家离开房间
  onPlayerRoomLeft({ leftPlayer }) {
    // 删除玩家
    cc.log(`${leftPlayer.userId} left room`);
    const client = getClient();
    // 转换成事件通知客户端
    client.sendEvent(Constants.PLAYER_LEFT_EVENT, {
      playerId: leftPlayer.actorId
    });
  }
});