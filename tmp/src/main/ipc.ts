import * as path from 'path';

import {
  app,
  ipcMain,
} from 'electron';

import * as menubar from "menubar";
// const menubar = require('menubar');

import { format as formatUrl } from 'url';

// require('fix-path')(); // resolve user $PATH env variable

const devMode = process.env.NODE_ENV === "development";

// if (devMode) {
//   require('electron-debug')({
//     showDevTools: true
//   });
// }

const installExtensions = async () => {
  if (process.env.NODE_ENV === 'development') {
    const installer = require('electron-devtools-installer');

    const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];
    const forceDownload = !!process.env.UPGRADE_EXTENSIONS;

    return Promise.all(
      extensions.map(name => installer.default(installer[name],
        forceDownload)),
    ).catch(console.log);
  }
};


export const reset = "\x1b[0m";
export const dim = "\x1b[2m";
export const highlight = "\x1b[36m";
export const log = devMode ? x => {
  process.stdout.write(`[debug] ${dim}`);
  process.stdout.write(x);
  process.stdout.write(`${reset}\n`);
} : () => null;


export const mb = menubar({
  tooltip: "Swapperd",
  preloadWindow: true,
  resizable: devMode,
  webPreferences: {
    // nodeIntegration: false,
    // preload: __dirname + "/preload.js",
    webSecurity: false,
  },
  alwaysOnTop: process.env.NODE_ENV === 'development',
  // icon: path.join(app.getAppPath(), 'resources/IconTemplate.png'),
  minWidth: 500,
  maxWidth: 500,
  minHeight: 500,

  index: devMode ? `http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}` : formatUrl({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file',
    slashes: true
  }),
  icon: "./IconTemplate.png",
  //   resizable: true,
  // transparent: true,
});

mb.on('ready', async () => {
  await installExtensions();

  console.log('app is ready');
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ipc communication
ipcMain.on('quit', () => {
  app.quit();
});


/**
 * sendToRenderer is used to communicate to the Renderer
 * 
 * @param {string} path
 * @param {any} value
 * @param {Error} error
 */
export const sendToRenderer = (path, value, error) => {
  // log(`sendToRenderer: ${path} ${JSON.stringify(value)} ${error}`);
  mb.window.webContents.send(path, value, error);
}

/**
 * In order to use this, two routes must be defined in main.js, `${route}` and
 * `${route}-response`.
 * 
 * @param {string} route
 * @param {number} seconds
 * @param {any} value
 */
export const sendSyncWithTimeout = (route, seconds, value) => new Promise((resolve,
  reject) => {
  once(`${route}-response`,
    /**
     * @param {any} value
     * @param {Error} error
     */
    (value, error) => {
      log(
        `${highlight}sendSync${reset}${dim}: ${route} => (${error ? `err: ${error}` : value})`
      );

      if (error) {
        reject(error);
      }

      resolve(value);
    });

  sendToRenderer(route, value, null);

  // Reject after timeout
  if (seconds !== 0) {
    setTimeout(() => reject(new Error("timeout")), seconds * 1000);
  }
});

export const on =
  /**
   * @param {string} route
   * @param {(value: any, error: Error) => any | Promise<any>} callback
   */
  (route, callback) => {

    ipcMain.on(route,
      /**
       * @param {any} _event
       * @param {[any, Error]} args
       */
      async (_event, ...args) => {
        log(
          `${highlight}on(${route})${reset}${dim} with args: (${JSON.stringify(args)})`
        );
        try {
          const [value, _error] = args;
          let response;
          try {
            response = await callback(value, _error);

          } catch (error) {
            console.error(error);
            sendToRenderer(`${route}-response`, response, error);
            return;
          }

          sendToRenderer(`${route}-response`, response, null);
        } catch (error) {
          console.error(error);
        }
      }
    );
  }

const once =
  /**
   * @param {string} route
   * @param {{ (value: any, error: Error): void | Promise<void>; }} callback
   */
  (route, callback) => {
    ipcMain.once(route,
      /**
       * @param {any} _event
       */
      async (_event, ...args) => {
        try {
          const [params, error] = args;
          callback(params, error);
        } catch (error) {
          callback(null, error);
        }
      });
  }

// module.exports = {
//   on,
//   mb,
//   sendSyncWithTimeout,
//   sendToRenderer,
//   log,
//   dim,
//   highlight,
//   reset,
// }