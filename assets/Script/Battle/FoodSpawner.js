const LeanCloud = require("../LeanCloud");
const { getClient } = LeanCloud;
const { randomPos } = require("./BattleHelper");
const Food = require("./Food");
const Constants = require("../Constants");

const { Event } = Play;

/**
 * 食物生成器
 */
cc.Class({
  extends: cc.Component,

  properties: {
    foodTempleteList: {
      type: cc.Prefab,
      default: []
    }
  },

  // LIFE-CYCLE CALLBACKS:

  initPlay() {
    this._idToFoods = {};
    const client = getClient();
    client.on(
      Event.ROOM_CUSTOM_PROPERTIES_CHANGED,
      this.onRoomPropertiesChanged,
      this
    );
    client.on(Event.CUSTOM_EVENT, this.onCustomEvent, this);
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
      console.log(`length: ${this.foodTempleteList.length}`);
      const type =
        parseInt(Math.random() * 1000000) % this.foodTempleteList.length;
      console.log(`type: ${type}`);
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

  spawnFoodNodes() {
    const client = getClient();
    const { roomFoods } = client.room.customProperties;
    cc.log(`spawn ${roomFoods.length} foods`);
    if (roomFoods) {
      roomFoods.forEach(roomFood => {
        const { id, type, x, y } = roomFood;
        const foodNode = cc.instantiate(this.foodTempleteList[type]);
        foodNode.position = cc.v2(x, y);
        this.node.addChild(foodNode);
        const food = foodNode.getComponent(Food);
        food.id = id;
        this._idToFoods[id] = food;
      });
    }
  },

  // Play Event

  onRoomPropertiesChanged({ changedProps }) {
    console.log(`room changed props: ${JSON.stringify(changedProps)}`);
    const { roomFoods } = changedProps;
    if (roomFoods) {
      this.spawnFoodNodes(roomFoods);
    }
  },

  onCustomEvent({ eventId, eventData }) {
    if (eventId === Constants.EAT_EVENT) {
      this.onEatEvent(eventData);
    }
  },

  onEatEvent(eventData) {
    const { bId, fId } = eventData;
    cc.log(`remove food: ${fId}`);
    // 移除 food
    const food = this._idToFoods[fId];
    delete this._idToFoods[fId];
    this.node.removeChild(food.node);
  }
});
