const Constants = require("../Constants");

function randomPos() {
  const x = parseInt(Constants.LEFT + Math.random() * Constants.WIDTH);
  const y = parseInt(Constants.BOTTOM + Math.random() * Constants.HEIGHT);
  return cc.v2(x, y);
}

module.exports = {
  randomPos
};
