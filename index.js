/******************************    load bots    ******************************/

var fs = require( 'fs' );
var botPath = __dirname + '/bots'
var bots = {};
var files = fs.readdirSync( botPath );
var leaderboard = [
  [ ' NAME ', ' WINS ', ' LOSSES ' ],
  [ '------', '------', '--------' ]
];

for( var i = 0; i < files.length; i++ ) {
  var file = files[i];
  var name = file.slice(0,-3);
  bots[i] = require( botPath + '/' + file );
  bots[i].name = name;
  bots[i].wins = 0;
  bots[i].losses = 0;
  leaderboard.push( [ name, '0', '0' ] );
}

/****************************    board drawing    *****************************/

var player1 = 'Foo';
var player2 = 'Bar';
var p1score = 2;
var p2score = 3;

/*
       |       |       
   X   |   X   |   X   
       |       |       
-------+-------+-------
       |       |       
   X   |   X   |   X   
       |       |       
-------+-------+-------
       |       |       
   X   |   X   |   X   
       |       |       
*/
var spacer = '       |       |       ';
var line   = '-------+-------+-------';
var nl     = '\n';
var blank  = ' ';
var x      = 'X';
var o      = 'O';
var xColor = 'red';
var oColor = 'green';
var board = [
  [ blank, blank, blank ],
  [ blank, blank, blank ],
  [ blank, blank, blank ]
];

var genCell = function ( cell ) {
  if ( cell === x ) {
    return '{' + xColor + '-fg}' + x + '{/' + xColor + '-fg}';
  } else if ( cell === o ) {
    return '{' + oColor + '-fg}' + o + '{/' + oColor + '-fg}';
  } else {
    return blank;
  }
};

var genRow = function ( row ) {
  return '   ' + genCell(row[0]) + '   |   ' + genCell(row[1]) + '   |   ' + genCell(row[2]) + '   ';
};

var genBoard = function ( board ) {
  return spacer + nl
       + genRow( board[0] )
       + nl + spacer + nl + line + nl + spacer + nl
       + genRow( board[1] )
       + nl + spacer + nl + line + nl + spacer + nl
       + genRow( board[2] )
       + nl + spacer;
};

/**********************************    TUI    *********************************/

var blessed = require('blessed');
var screen = blessed.screen({ autoPadding: false });

var top = blessed.table({
  parent: screen,
  top: '0%+1',
  left: '0%+1',
  width: '60%-2',
  tags: true,
  align: 'center',
  border: 'bg',
  noCellBorders: true,
  style: {
    border: {
      bg: '#222222',
      fg: '#222222'
    },
    header: {
      bg: 'white',
      fg: 'black'
    },
    cell: {
      bg: '#222222',
      fg: 'white'
    }
  },
  data: null
});
var left = blessed.box({
  parent: screen,
  top: '25%',
  left: '0%',
  width: '60%',
  height: '75%',
});
var right = blessed.box({
  parent: screen,
  top: 'center',
  left: '60%',
  width: '40%',
  height: '100%',
  tags: true,
  border: { type: 'line' },
  style: { border: { fg: 'white' } }
});

var stats = blessed.table({
  parent: right,
  top: '0%+2',
  left: '0%+1',
  data: null,
  align: 'center',
  tags: true,
  width: '100%-2',
  noCellBorders: true,
  style: { header: { bold: true } }
});
var game = blessed.box({
  parent: left,
  top: '0%+3',
  left: 'center',
  width: 'shrink',
  height: 'shrink',
  tags: true,
  content: null,
  border: {},
  bold: true,
  style: {
    fg: 'white',
    border: { fg: '#f0f0f0' },
  }
});

top.setData( [
  [ player1, 'versus', player2 ],
  [ p1score.toString(), ' ', p2score.toString() ]
] );
game.setContent( genBoard(board) );
stats.setData( leaderboard );

// Quit on Escape, q, or Control-C.
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

screen.render();

/********************************    battle    ********************************/

/****    turn-taking logic thoughts    ****
start with empty board
player 1 goes first
do for player 1 and then player 2
  check for stalemate
  ask player for a move (give player the board and the symbols)
    their symbol, opponent symbol, blank symbol
  make sure the move is legal
  check for win
    check horizontal from move cell
    check vertical from move cell
    if move cell is in diagonal lane
      check diagonal from move cell 
*/

var runGame = function ( p1, p2 ) {
  var p1move = bots[p1].nextMove();
  var p2move = bots[p2].nextMove();
  if ( p1move > p2move ) {
    bots[p1].wins++;
    bots[p2].losses++;
  } else {
    bots[p2].wins++;
    bots[p1].losses++;
  }
  leaderboard[+p1+2][1] = bots[p1].wins.toString();
  leaderboard[+p1+2][2] = bots[p1].losses.toString();
  leaderboard[+p2+2][1] = bots[p2].wins.toString();
  leaderboard[+p2+2][2] = bots[p2].losses.toString();
  stats.setData( leaderboard );
  screen.render();
};

var runRound = function () {
  for ( p1 in bots ) {
    for ( p2 in bots ) {
      runGame( p1, p2 );
    }
  }
};

for( var rounds = 0; rounds < 3; rounds++ ) {
  runRound();
}
