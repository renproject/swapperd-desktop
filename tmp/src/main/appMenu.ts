import { mb } from "./mb";

const application: Electron.MenuItemConstructorOptions = {
    label: "Application",
    submenu: [{
        label: "About",
        // selector: "orderFrontStandardAboutPanel:"
    },
    {
        type: "separator"
    },
    {
        label: "Quit",
        accelerator: "Command+Q",
        click: () => {
            mb.app.quit();
        }
    }
    ]
};

const edit: Electron.MenuItemConstructorOptions = {
    label: "Edit",
    submenu: [{
        label: "Undo",
        accelerator: "CmdOrCtrl+Z",
        // selector: "undo:"
    },
    {
        label: "Redo",
        accelerator: "Shift+CmdOrCtrl+Z",
        // selector: "redo:"
    },
    {
        type: "separator"
    },
    {
        label: "Cut",
        accelerator: "CmdOrCtrl+X",
        // selector: "cut:"
    },
    {
        label: "Copy",
        accelerator: "CmdOrCtrl+C",
        // selector: "copy:"
    },
    {
        label: "Paste",
        accelerator: "CmdOrCtrl+V",
        // selector: "paste:"
    },
    {
        label: "Select All",
        accelerator: "CmdOrCtrl+A",
        // selector: "selectAll:"
    }
    ]
};

export const template: Electron.MenuItemConstructorOptions[] = [
    application,
    edit
];

export const contextTemplate: Electron.MenuItemConstructorOptions[] = [
    {
        type: "separator"
    },
    {
        label: "Quit Swapperd",
        click: () => {
            mb.app.quit();
        }
    }
];
