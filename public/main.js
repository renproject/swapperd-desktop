var menubar = require('menubar')

var mb = menubar();

mb.on('ready', function ready() {
  console.log('App is being served...');
})