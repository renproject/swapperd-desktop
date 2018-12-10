const createDMG = require("electron-installer-dmg")
const rimraf = require("rimraf");
const path = require("path");

var argv = require("minimist")(process.argv.slice(2));
var outputDir = process.env.npm_package_config_outputDir;
var name = process.env.npm_package_name;
var appName = process.env.npm_package_config_appName;
var appPath = `${argv.sourcePath}/${name}.app`;
var outputDir = process.env.npm_package_config_outputDir;

var options = {
    appPath,
    name: appName,
    out: outputDir,
    overwrite: true,
    icon: argv.icon,
};

createDMG(options, err => {
    if (err) throw err;
    console.log(`Wrote DMG to: ${path.resolve(`${outputDir}/${appName}.dmg`)}`);
    if (argv.clean === true) {
        rimraf(argv.sourcePath, {}, (error) => {
            if (error) throw error;
            console.log(`Removed source directory: ${path.resolve(argv.sourcePath)}`);
        });
    }
})