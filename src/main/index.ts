
import "./main";

// 'use strict'

// import { app } from 'electron'
// import * as path from 'path'
// import { format as formatUrl } from 'url';

// const isDevelopment = process.env.NODE_ENV !== 'production'
// console.log(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}/dist/IconTemplate.png`);

// // @ts-ignore
// import menubar from "menubar";

// var mb = menubar({
//   index: isDevelopment ? `http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}` : formatUrl({
//     pathname: path.join(__dirname, 'index.html'),
//     protocol: 'file',
//     slashes: true
//   }),
//   icon: "./IconTemplate.png",
// })

// mb.on('ready', function ready() {
//   console.log('app is ready')
//   // your app code here
// })

// mb.on("after-create-window", function () {
//   // @ts-ignore
//   mb.window.openDevTools();
// });

// // // global reference to mainWindow (necessary to prevent window from being garbage collected)
// // let mainWindow: any;

// // function createMainWindow() {
// //   const window = new BrowserWindow()

// //   if (isDevelopment) {
// //     window.webContents.openDevTools()
// //   }

// //   if (isDevelopment) {
// //     window.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`)
// //   }
// //   else {
// //     window.loadURL(formatUrl({
// //       pathname: path.join(__dirname, 'index.html'),
// //       protocol: 'file',
// //       slashes: true
// //     }))
// //   }

// //   window.on('closed', () => {
// //     mainWindow = null
// //   })

// //   window.webContents.on('devtools-opened', () => {
// //     window.focus()
// //     setImmediate(() => {
// //       window.focus()
// //     })
// //   })

// //   return window
// // }

// // // quit application when all windows are closed
// // app.on('window-all-closed', () => {
// //   // on macOS it is common for applications to stay open until the user explicitly quits
// //   if (process.platform !== 'darwin') {
// //     app.quit()
// //   }
// // })

// // app.on('activate', () => {
// //   // on macOS it is common to re-create a window even after all windows have been closed
// //   if (mainWindow === null) {
// //     mainWindow = createMainWindow()
// //   }
// // })

// // // create main BrowserWindow when electron is ready
// // app.on('ready', () => {
// //   mainWindow = createMainWindow()
// // })
