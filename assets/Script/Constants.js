const WIDTH = 1920;
const HEIGHT = 1280;
// 边界
const LEFT = -WIDTH / 2;
const RIGHT = -LEFT;
const TOP = HEIGHT / 2;
const BOTTOM = -TOP;
// 距离最小容忍误差
const DISTANCE_MAG = 4;
// 初始生成食物数量
const INIT_FOOD_COUNT = 200;
// 同步食物时长
const SYNC_FOOD_DURATION = 200000;
// 补充食物时长
const SPAWN_FOOD_DURATION = 1000000;

// 节点组
const BALL_GROUP = "ball";
const FOOD_GROUP = "food";

// 游戏时长
const GAME_DURATION = 120;
// 游戏时长更新频率
const SYNC_GAME_DURATION = 10000;
// 初始尺寸
const BORN_SIZE = 48;
// 速度因子，实际速度 = 速度因子 / 体重
const SPEED_FACTOR = 300000;
// 最小速率
const MIN_SPEED = 30;
// 食物重量
const FOOD_WEIGHT = 100;
// 圆周率
const PI = 3.14;

// 自定义通信事件
// 玩家出生事件
const BORN_EVENT = "BORN_EVENT";
// 吃食物
const EAT_EVENT = "EAT_EVENT";
// 杀死玩家
const KILL_EVENT = "KILL_EVENT";
// 玩家离开
const PLAYER_LEFT_EVENT = "PLAYER_LEFT_EVENT";
// 重生
const REBORN_EVENT = "REBORN_EVENT";
// 生成食物
const SPAWN_FOOD_EVENT = "SPAWN_FOOD_EVENT";

// 自定义逻辑事件
// 球和食物碰撞事件
const BALL_AND_FOOD_COLLISION_EVENT = "BALL_AND_FOOD_COLLISION_EVENT";
// 球和球碰撞事件
const BALL_AND_BALL_COLLISION_EVENT = "BALL_AND_BALL_COLLISION_EVENT";

module.exports = {
  WIDTH,
  HEIGHT,

  LEFT,
  RIGHT,
  TOP,
  BOTTOM,
  DISTANCE_MAG,
  INIT_FOOD_COUNT,
  SYNC_FOOD_DURATION,
  SPAWN_FOOD_DURATION,

  BALL_GROUP,
  FOOD_GROUP,

  GAME_DURATION,
  SYNC_GAME_DURATION,
  BORN_SIZE,
  SPEED_FACTOR,
  MIN_SPEED,
  FOOD_WEIGHT,
  PI,

  BORN_EVENT,
  EAT_EVENT,
  KILL_EVENT,
  PLAYER_LEFT_EVENT,
  REBORN_EVENT,
  SPAWN_FOOD_EVENT,

  BALL_AND_FOOD_COLLISION_EVENT,
  BALL_AND_BALL_COLLISION_EVENT
};
