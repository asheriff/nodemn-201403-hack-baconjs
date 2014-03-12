var http = require('http');
var sockjs = require('sockjs');
var _ = require('lodash');
var Bacon = require('baconjs').Bacon;

// Array of all websocket connections.
var clients = [];

// Broadcast the `message` to all websocket connections.
var broadcast = function(message){
  _(clients).each(function(conn){
    conn.write(message);
  })
};

// Event bus. Keeps track of total messages across all clients.
var bus = new Bacon.Bus;

// Create the websocket server.
var ws = sockjs.createServer();

// Handle new connections.
ws.on('connection', function(conn) {
  clients.push(conn);

  broadcast('Clients: ' + clients.length);

  // When a message is received push it to the bus.
  conn.on('data', function(message) {
    bus.push(parseInt(message, 10));
  });

  conn.on('close', function(){
    _.remove(clients, conn);
    broadcast('Clients: ' + clients.length);
  });
});


// Log the value pushed to the event bus.
bus.onValue(function(val){
  console.log('bus saw: ' + val);
});

// Create a stream from the event bus that sums the total of values.
var sumStream = bus.scan(0, function(sum, val){
  return sum + val
});

// Log the sum.
sumStream.onValue(function(val){
  console.log('sumStream: ' + val);
});

// Create a throttled event stream from the sumStream that emits the sum every N ms.
var slowSumStream = sumStream.throttle(1000);

// Broadcast the throttle event stream's sum when it changes.
slowSumStream.onValue(function(val){
  broadcast('slowSumStream: ' + val);
});

// Create a stream from the throttled sum that emits the difference.
var diffStream = slowSumStream.diff(0, function(a, b){
  return b - a;
});

// Broadcast the diff event stream's value when it changes.
diffStream.onValue(function(val){
  broadcast('diffStream: ' + val);
});


// Create the server, handle sockets.
var server = http.createServer();
ws.installHandlers(server, {prefix:'/bacon'});
server.listen(9999, '0.0.0.0');
