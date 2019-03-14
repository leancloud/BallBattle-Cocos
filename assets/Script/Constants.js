const WIDTH = 1920;
const HEIGHT = 1280;
// 边界
const LEFT = -WIDTH / 2;
const RIGHT = -LEFT;
const TOP = HEIGHT / 2;
const BOTTOM = -TOP;
// 距离最小容忍误差
const DISTANCE_MAG = 2;
// 初始生成食物数量
const INIT_FOOD_COUNT = 100;

// 节点组
const BALL_GROUP = "ball";
const FOOD_GROUP = "food";

// 自定义事件
const EAT_EVENT = "EAT_EVENT";

// 速度因子，实际速度 = 速度因子 / 体重
const SpeedFactor = 300000;
// 最小速度
const MinSpeed = 30;

module.exports = {
  WIDTH,
  HEIGHT,
  LEFT,
  RIGHT,
  TOP,
  BOTTOM,
  DISTANCE_MAG,
  INIT_FOOD_COUNT,
  BALL_GROUP,
  FOOD_GROUP,
  EAT_EVENT,
  SpeedFactor,
  MinSpeed
};
