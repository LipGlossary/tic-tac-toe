var nextMove = function ( board, mine, opp, space ) {
  return [ Math.floor(Math.random()*3), Math.floor(Math.random()*3) ];
};

module.exports = { nextMove : nextMove };
