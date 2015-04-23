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
drawGame( game, newBoard() );
drawStats( stats );

// Quit on Escape, q, or Control-C.
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

/********************************    battle    ********************************/

var isStalemate = function ( board, blank ) {
  for( var i = 0; i < board.length; i++ ) {
    for( var j = 0; j < board.length; j++ ) {
      if ( board[i][j] === blank ) {
        return false;
      }
    }
  }
  return true;
};

var match3 = function ( a, b, c ) {
  if ( a === b && a === c ) { return true; }
  return false;
};

var checkWin = function ( player, board, row, col ) {
  var win = false;
  win = win || match3( board[row][0], board[row][1], board[row][2] );
  win = win || match3( board[0][col], board[1][col], board[2][col] );
  if ( (row+col) === 2 ) {
    win = win || match3( board[0][2], board[1][1], board[2][0] );
  }
  if ( row === col ) {
    win = win || match3( board[0][0], board[1][1], board[2][2] );
  }
  return win;
};

var getMove = function ( player, board, ours, theirs, blank ) {
  // TODO: forfeit turn if timeout and display message
  var move = player.nextMove( cloneBoard(board), ours, theirs, blank );
  var row = move[0];
  var col = move[1];
  // TODO: display message for illegal turn
  if ( board[row][col] !== blank ) { return false; }
  board[row][col] = ours;
  drawGame( game, board );
  return checkWin( player, board, row, col );
};

var runGame = function ( p1, p2 ) {
  var board = newBoard();
  var winner = null;
  while( !isStalemate( board, blank ) ) {
    var p1win = getMove( p1, board, x, o, blank );
    if ( p1win ) {
      winner = [ p1, p2 ];
      break;
    }
    var p2win = getMove( p2, board, o, x, blank );
    if ( p2win ) {
      winner = [ p2, p1 ];
      break;
    }
  }
  if ( winner === null ) {
    p1.ties++;
    p2.ties++;
    // TODO: display message
  } else {
    winner[0].wins++;
    winner[1].losses++;
    // TODO: display message
  }
  drawStats( stats );
};

var runRound = function () {
  for ( p1 in bots ) {
    for ( p2 in bots ) {
      if ( p1 !== p2 ) {
        runGame( bots[p1], bots[p2] );
      }
    }
  }
};

for( var rounds = 0; rounds < 3; rounds++ ) {
  runRound();
}
