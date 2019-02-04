// const {
//     exec
// } = require('child_process');

export const updateSwapperd = async (_mnemonic: string) => {

  // let mnemonicFlag = "";

  // if (process.platform === "win32") {
  //     if (mnemonic !== "") {
  //         mnemonicFlag = ` --mnemonic ${mnemonic}`
  //     }
  //     exec(`"%programfiles(x86)%\\Swapperd\\bin\\installer.exe"${mnemonicFlag}`, (err, stdout, stderr) => {
  //         if (err) {
  //             console.error(err);
  //             return;
  //         }
  //         exec('sc create swapperd binpath= "%programfiles(x86)%\\Swapperd\\bin\\swapperd.exe"', () => {
  //             exec('sc start swapperd', async (err, stdout, stderr) => {
  //                 if (err) {
  //                     console.error(err);
  //                     return reject(err);
  //                 }
  //                 return resolve(await handleAccountCreation(password));
  //             });
  //         })
  //     })
  // } else {
  //     if (mnemonic) {
  //         mnemonicFlag = `-s "${mnemonic}"`
  //     }

  //     try {
  //         await updateSwapperd(mnemonic);
  //         return resolve(await handleAccountCreation(password));
  //     } catch (error) {
  //         reject(error);
  //     }
  // }

  // const {
  //     stdout: _stdout,
  //     stderr: _stderr,
  // } = exec(`curl https://releases.republicprotocol.com/swapperd/install.sh -sSf | sh ${mnemonicFlag}`);

  return;
};
