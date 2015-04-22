/******************************    load bots    ******************************/

var fs = require( 'fs' );
var botPath = __dirname + '/bots'
var bots = {};
var files = fs.readdirSync( botPath );

for( var i = 0; i < files.length; i++ ) {
  var file = files[i];
  var tag = file.slice(0,-3);
  bots[tag] = require( botPath + '/' + file );
  bots[tag].seed = i;
  console.log( bots[tag] );
}

/**********************************    TUI    *********************************/

var player1 = 'Foo';
var player2 = 'Bar';
var p1score = 2;
var p2score = 3;
var board = [
  [ 'X', 'O', 'X' ],
  [ 'O', 'X', 'O' ],
  [ 'X', 'O', 'X' ]
];

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
var x      = 'X';
var o      = 'O';
var xColor = 'red';
var oColor = 'green';

var genCell = function ( cell ) {
  if ( cell === x ) {
    return '{' + xColor + '-fg}' + x + '{/' + xColor + '-fg}';
  } else {
    return '{' + oColor + '-fg}' + o + '{/' + oColor + '-fg}';
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

var blessed = require('blessed');
var screen = blessed.screen({ autoPadding: false });

var top = blessed.table({
  parent: screen,
  top: '0%+1',
  left: '0%+1',
  width: '60%-2',
  tags: true,
  align: 'center',
  style: {
    header: {
      bg: 'white',
      fg: 'black'
    }
  },
  data: null
});
var left = blessed.box({
  parent: screen,
  top: '10%',
  left: '0%',
  width: '60%',
  height: '90%',
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
var game = blessed.box({
  parent: left,
  top: 'center',
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

top.setData( [ [ player1 + ': ' + p1score, 'versus', player2 + ': ' + p2score ] ] );
game.setContent( genBoard(board) );

// Quit on Escape, q, or Control-C.
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

screen.render();
