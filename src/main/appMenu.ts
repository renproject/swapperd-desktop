import { MenubarApp } from "./menubar";

export const getMenuTemplate = (mb: MenubarApp): Electron.MenuItemConstructorOptions[] => {

    const application: Electron.MenuItemConstructorOptions = {
        label: "Application",
        submenu: [{
            label: "About",
            role: "orderFrontStandardAboutPanel"
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
            role: "undo"
        },
        {
            label: "Redo",
            accelerator: "Shift+CmdOrCtrl+Z",
            role: "redo"
        },
        {
            type: "separator"
        },
        {
            label: "Cut",
            accelerator: "CmdOrCtrl+X",
            role: "cut"
        },
        {
            label: "Copy",
            accelerator: "CmdOrCtrl+C",
            role: "copy"
        },
        {
            label: "Paste",
            accelerator: "CmdOrCtrl+V",
            role: "paste"
        },
        {
            label: "Select All",
            accelerator: "CmdOrCtrl+A",
            role: "selectAll"
        }
        ]
    };

    return [
        application,
        edit,
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
};
