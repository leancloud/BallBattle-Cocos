const LeanCloud = require("../LeanCloud");
const Constants = require("../Constants");
const { randomPos } = require("./BattleHelper");

const { getClient } = LeanCloud;

/**
 * 游戏逻辑控制器
 * 处理 SDK 事件，转换成新的自定义事件同步给客户端
 */
cc.Class({
  extends: cc.Component,

  properties: {},

  // LIFE-CYCLE CALLBACKS:

  start() {
    const client = getClient();
    //
    client.on(Event.PLAYER_ROOM_JOINED, this.onPlayerRoomJoined, this);
    client.on(Event.PLAYER_ROOM_LEFT, this.onPlayerRoomLeft, this);
    client.on(
      Event.PLAYER_CUSTOM_PROPERTIES_CHANGED,
      this.onPlayerPropertiesChanged,
      this
    );
    client.on(Event.CUSTOM_EVENT, this.onCustomEvent, this);
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

    // 判断游戏刚刚开始，还是切换了 Master
    let { duration } = client.room.customProperties;
    if (duration === undefined) {
      // 新游戏，对游戏进行初始化
      duration = Constants.GAME_DURATION;
      client.room.setCustomProperties({ duration });
    } else {
      // 继续游戏
    }
    setInterval(() => {
      this._duration--;
    }, 1000);

    // 同步食物
    setInterval(() => {
      const foods = Object.values(this._idToFoods);
      console.log(`current foods count: ${foods.length}`);
      const roomFoods = [];
      foods.forEach(f => {
        const { id, type } = f;
        const { x, y } = f.node.position;
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
    setInterval(() => {
      // TODO 补充食物
      const foods = Object.values(this._idToFoods);
      const spawnFoodCount = Constants.INIT_FOOD_COUNT - foods.length;
      cc.log(`respawn: ${spawnFoodCount}`);
      this.spawnFoodsData(spawnFoodCount);
    }, Constants.SPAWN_FOOD_DURATION);
  },

  /**
   * 生成食物数据
   * @param {Number} count
   */
  spawnFoodsData(count) {
    const client = getClient();
    const roomFoods = [];
    // 只生成数据
    let { roomFoodId } = client.room.customProperties;
    if (!roomFoodId) {
      roomFoodId = 0;
    }
    // 暂定初始生成 100 个食物
    for (let i = 0; i < count; i++) {
      const id = roomFoodId + i;
      const type =
        parseInt(Math.random() * 1000000) % this.foodTempleteList.length;
      const { x, y } = randomPos();
      roomFoods.push({ id, type, x, y });
    }
    roomFoodId += count;
    // 此时可能导致消息很大
    client.room.setCustomProperties({
      roomFoodId,
      roomFoods
    });
  },

  // Cocos Events
  onBallAndFoodCollision(event) {
    const { ball, food } = event.detail;
    // Master 用来处理逻辑同步
    // 同步玩家属性：体重和速度
    let { weight } = food._player.customProperties;
    weight += Constants.FOOD_WEIGHT;
    const speed = Constants.SPEED_FACTOR / weight;
    this._player.setCustomProperties({ weight, speed });
    // 通知吃食物的事件
    const options = {
      receiverGroup: ReceiverGroup.All
    };
    const bId = ball.getId();
    const fId = food.id;
    client.sendEvent(Constants.EAT_EVENT, { bId, fId }, options);
  },

  onBallAndBallCollision(event) {
    const { b1Node, b2Node } = event.detail;
    // 比较两个球的体重，体重大者获胜
    cc.log(`${otherNode.name}, ${selfNode.name}`);
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
    // 生成其他玩家
    console.log(`${newPlayer.userId} joined room`);
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

  // 玩家离开房间
  onPlayerRoomLeft({ leftPlayer }) {
    // 删除玩家
    console.log(`${leftPlayer.userId} left room`);
    // 转换成事件通知客户端
    client.sendEvent(Constants.PLAYER_LEFT_EVENT, {
      playerId: leftPlayer.actorId
    });
  }
});
