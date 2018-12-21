const installer = require("electron-installer-debian")
const path = require("path");
const rimraf = require("rimraf");

var argv = require("minimist")(process.argv.slice(2));

const outputDir = process.env.npm_package_config_outputDir;

const debInstallerOptions = {
  src: argv.sourcePath,
  dest: outputDir,
  arch: "amd64",
  icon: {
    "48x48": "./assets/icons/png/48x48.png",
    "64x64": "./assets/icons/png/64x64.png",
    "128x128": "./assets/icons/png/128x128.png",
    "256x256": "./assets/icons/png/256x256.png",
  }
};

console.log(`Building from source directory: ${path.resolve(debInstallerOptions.src)}`);

console.log("Creating package (this may take a while)")
const outputPackage = `${debInstallerOptions.dest}/${process.env.npm_package_productName}_${process.env.npm_package_version}_${debInstallerOptions.arch}.deb`;

installer(debInstallerOptions)
  .then(() => {
    console.log(`Successfully created package at ${path.resolve(outputPackage)}`);

    // Clean up source code if necessary
    if (argv.clean === true) {
      rimraf(argv.sourcePath, {}, (error) => {
        if (error) throw error;
        console.log(`Removed source directory: ${path.resolve(argv.sourcePath)}`);
      });
    }
  })
  .catch(err => {
    console.error(err, err.stack)
    process.exit(1)
  })
