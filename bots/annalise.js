var nextMove = function ( board, me, you, empty ) {
  return [ Math.floor(Math.random()*3), Math.floor(Math.random()*3) ];
};

module.exports = { nextMove : nextMove };
