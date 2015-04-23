/******************************    load bots    ******************************/

var fs = require( 'fs' );
var botPath = __dirname + '/bots'
var bots = {};
var files = fs.readdirSync( botPath );

for( var i = 0; i < files.length; i++ ) {
  var file = files[i];
  var name = file.slice(0,-3);
  bots[i] = require( botPath + '/' + file );
  bots[i].name = name;
  bots[i].wins = 0;
  bots[i].losses = 0;
  bots[i].ties = 0;
}

/****************************    board settings    ****************************/

var player1 = '';
var player2 = '';
var p1score = 0;
var p2score = 0;

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
var empty  = [
  [ blank, blank, blank ],
  [ blank, blank, blank ],
  [ blank, blank, blank ]
];

var cloneBoard = function ( board ) {
  var clone = new Array();
  for ( var i = 0; i < 3; i++ ) {
    var row = new Array();
    for ( var j = 0; j < 3; j++ ) {
      row.push( board[i][j] );
    }
    clone.push( row );
  }
  return clone;
};

var newBoard = function () {
  return cloneBoard( empty );
};

var board = newBoard();

/**********************************    TUI    *********************************/

var blessed = require('blessed');
var screen = blessed.screen({ autoPadding: false });

var top = blessed.table({
  parent: screen,
  top: '0%+1',
  left: '0%+1',
  width: '50%-2',
  tags: true,
  align: 'center',
  border: 'bg',
  noCellBorders: true,
  style: {
    header: {
      bg: 'white',
      fg: 'black'
    },
  },
  data: null
});
var left = blessed.box({
  parent: screen,
  top: '25%',
  left: '0%',
  width: '50%',
  height: '75%',
});
var right = blessed.box({
  parent: screen,
  top: 'center',
  left: '50%',
  width: '50%',
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

var drawTop = function ( elem, p1, p2 ) {
  elem.setData( [
    [ p1.name, 'versus', p2.name ],
    [
      '{green-fg}' + p1.wins + '{/green-fg} / {red-fg}' + p1.losses + '{/red-fg} / {cyan-fg}' + p1.ties + '{/cyan-fg}',
      ' ',
      '{green-fg}' + p2.wins + '{/green-fg} / {red-fg}' + p2.losses + '{/red-fg} / {cyan-fg}' + p2.ties + '{/cyan-fg}',
    ]
  ]);
  screen.render();
};

var drawCell = function ( cell ) {
  if ( cell === x ) {
    return '{' + xColor + '-fg}' + x + '{/' + xColor + '-fg}';
  } else if ( cell === o ) {
    return '{' + oColor + '-fg}' + o + '{/' + oColor + '-fg}';
  } else {
    return blank;
  }
};

var drawRow = function ( row ) {
  return '   ' + drawCell(row[0]) + '   |   ' + drawCell(row[1]) + '   |   ' + drawCell(row[2]) + '   ';
};

var drawBoard = function ( board ) {
  return spacer + nl
       + drawRow( board[0] )
       + nl + spacer + nl + line + nl + spacer + nl
       + drawRow( board[1] )
       + nl + spacer + nl + line + nl + spacer + nl
       + drawRow( board[2] )
       + nl + spacer;
};

var drawGame = function ( elem, board ) {
  elem.setContent( drawBoard(board) );
  screen.render();
};

var genLeaderboard = function () {
  var leaderboard = [
    [ ' NAME ', ' WINS ', ' LOSSES ', ' TIES ' ],
    [ '------', '------', '--------', '------' ]
  ];
  for ( bot in bots ) {
    var player = bots[bot];
    leaderboard.push( [
      player.name,
      player.wins.toString(),
      player.losses.toString(),
      player.ties.toString()
    ] );
  }
  return leaderboard;
};

var drawStats = function ( elem ) {
  elem.setData( genLeaderboard() );
  screen.render();
}

drawTop( top, bots['0'], bots['1'] );
drawGame( game, board );
drawStats( stats );

// Quit on Escape, q, or Control-C.
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

/********************************    battle    ********************************/

/****    turn-taking logic thoughts    ****
start with empty board
player 1 goes first
do for player 1 and then player 2
  check for stalemate
  ask player for a move (give player the board and the symbols)
    clone the board so they can't cheat
    parameters: board, their symbol, opponent symbol, blank symbol
    return: [ row, col ]
    forfeit turn if timeout
  make sure the move is legal
    forfeit turn if illegal
  check for win
    check horizontal from move cell
    check vertical from move cell
    if move cell is in diagonal lane
      check diagonal from move cell 
*/

var runGame = function ( p1, p2 ) {
  var p1move = bots[p1].nextMove( cloneBoard(board), x, o, blank );
  var p2move = bots[p2].nextMove( cloneBoard(board), x, o, blank );
  if ( Math.floor(p1move*10) === Math.floor(p2move*10) ) {
    bots[p1].ties++;
    bots[p2].ties++;
  } else if ( p1move > p2move ) {
    bots[p1].wins++;
    bots[p2].losses++;
  } else {
    bots[p2].wins++;
    bots[p1].losses++;
  }
  drawStats( stats );
};

var runRound = function () {
  for ( p1 in bots ) {
    for ( p2 in bots ) {
      if ( p1 !== p2 ) {
        runGame( p1, p2 );
      }
    }
  }
};

for( var rounds = 0; rounds < 3; rounds++ ) {
  runRound();
}
