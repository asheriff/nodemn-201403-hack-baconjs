var sock = new SockJS('http://0.0.0.0:9999/bacon');

var logSend = function(message){
  // console.log('%c> ' + message, 'color: green');
  sock.send(message);
};

var logRcvd = function(m){
  console.log('%c< ' + m, 'color: purple');
};

var increment = function(){
  logSend(1);
};

var interval;

sock.onopen = function() {
  console.log('socket opened');
  interval = setInterval(increment, 100)
};

sock.onmessage = function(e) {
  logRcvd(e.data);
};

sock.onclose = function() {
  console.log('socket closed');
  clearInterval(interval);
};
