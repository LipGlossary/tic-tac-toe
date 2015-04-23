var nextMove = function ( game, self, opp, blank ) {
  return [ Math.floor(Math.random()*3), Math.floor(Math.random()*3) ];
};

module.exports = { nextMove : nextMove };
