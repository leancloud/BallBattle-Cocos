const WIDTH = 1920;
const HEIGHT = 1280;
// 边界
const LEFT = -WIDTH / 2;
const RIGHT = -LEFT;
const TOP = HEIGHT / 2;
const BOTTOM = -TOP;
// 距离最小容忍误差
const DISTANCE_MAG = 4;
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
  SpeedFactor,
  MinSpeed
};
