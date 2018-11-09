const WebSocket = require('ws');
const menubar = require('menubar')

const mb = menubar({
  icon: "./IconTemplate.png",
});

mb.on('ready', function ready() {
  console.log('App is being served...');
})

const wss = new WebSocket.Server({
  port: 8080
});

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });

  ws.send('something');
});