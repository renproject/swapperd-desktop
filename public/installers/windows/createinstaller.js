const fs = require("fs");
const path = require("path");
const Mustache = require("mustache");
const InnoCompiler = require("innosetup-compiler");

const packageName = process.env.npm_package_name;
const appName = process.env.npm_package_config_appName;
const appVersion = process.env.npm_package_version;
const outputDir = process.env.npm_package_config_outputDir;
const rootPath = path.join("./")
const outPath = path.join(rootPath, outputDir);
const appDir = path.join(outPath, `${packageName}-win32-ia32`);

var argv = require('minimist')(process.argv.slice(2));

var options = {
  appName,
  appVersion,
  publisher: argv.publisher,
  licenseFile: argv.licenseFile,
  outputFilename: `${appName}Installer`,
  packageName,
  appDir,
};

var templateFile = "./template.iss";
var templatePath = path.join(path.dirname(__filename), templateFile);
var template = fs.readFileSync(templatePath).toString();

var output = Mustache.render(template, options);


var finalISS = "final.iss";
fs.writeFile(finalISS, output, (err) => {
  console.log(err);
});

InnoCompiler(finalISS, {
  O: outPath,
  gui: false,
  verbose: false,
}, function (error) {
  // callback
  if (error) {
    console.log(error);
  } else {
    console.log(`Saved Windows installer to: ${outPath}/${options.outputFilename}`);
  }
});
