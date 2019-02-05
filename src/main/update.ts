import { exec } from "child_process";

const run = async (command: string) => new Promise((resolve, reject) => {
    const cmd = exec(command, (error) => {
        if (error) {
            reject(error);
        }
        resolve();
    });

    // cmd.stdout.pipe(process.stdout);
    // cmd.stderr.pipe(process.stderr);

    cmd.stdout.on("data", (data) => {
        console.log(data);
    });

    cmd.stderr.on("data", (data) => {
        console.error(data);
    });
});

export const updateSwapperd = async (mnemonic: string) => {

    let mnemonicFlag = "";

    if (process.platform === "win32") {
        if (mnemonic) {
            mnemonicFlag = ` --mnemonic ${mnemonic}`;
        }

        await run(`"%programfiles(x86)%\\Swapperd\\bin\\installer.exe"${mnemonicFlag}`);
        await run("sc create swapperd binpath= \"%programfiles(x86)%\\Swapperd\\bin\\swapperd.exe\"");
        await run("sc start swapperd");
        return;
    } else {
        if (mnemonic) {
            mnemonicFlag = `-s "${mnemonic}"`;
        }
        await run(`curl https://releases.republicprotocol.com/swapperd/install.sh -sSf | sh ${mnemonicFlag}`);
        return;
    }
};
