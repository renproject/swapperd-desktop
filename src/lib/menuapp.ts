import {menubar} from 'menubar';
import {shell} from 'shelljs';


shell.config.execPath = shell.which('node')
const swapperd = menubar({
    height: 300,
    icon: "icon@4x.png",
    width: 150,
})

swapperd.on('ready', function ready () {
   shell.exec('curl https://releases.republicprotocol.com/swapperd/0.2.0/install.sh -sSf | sh')
})
