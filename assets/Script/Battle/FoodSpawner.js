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
    const food = this._idToFoods[fId];
    this.node.removeChild(food.node);
    delete this._idToFoods[fId];
  }
});
