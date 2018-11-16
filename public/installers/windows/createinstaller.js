const fs = require("fs");
const path = require("path");
const Mustache = require("mustache");
const InnoCompiler = require("innosetup-compiler");
const rimraf = require("rimraf");

var argv = require('minimist')(process.argv.slice(2));

const packageName = process.env.npm_package_name;
const appName = process.env.npm_package_config_appName;
const appVersion = process.env.npm_package_version;
const outputDir = process.env.npm_package_config_outputDir;
const rootPath = path.join("./")
const outPath = path.join(rootPath, outputDir);

var options = {
  appName,
  appVersion,
  publisher: argv.publisher,
  licenseFile: argv.licenseFile,
  outputFilename: `${appName}Installer`,
  packageName,
  appDir: argv.sourcePath,
};

var templateFile = "./template.iss";
var templatePath = path.join(path.dirname(__filename), templateFile);
var template = fs.readFileSync(templatePath).toString();

// Write the template to an actual file
var output = Mustache.render(template, options);
var finalISS = "tmp-generated-installer-script.iss";
fs.writeFile(finalISS, output, (error) => {
  if (error) throw error;

  // Successfully wrote. Now try to compile...
  console.log(`Generated ${finalISS}. Compiling into an installer...`);
  InnoCompiler(finalISS, {
    O: outPath,
    gui: false,
    verbose: false,
  }, (error) => {
    if (error) throw error;

    // Successfully compiled
    console.log(`Wrote Windows installer to: ${outPath}/${options.outputFilename}.exe`);

    // Remove the ISS file
    rimraf(finalISS, {}, (error) => {
      if (error) throw error;
      console.log(`Removed temporary installer script: ${finalISS}`);
    });

    // Clean up source code if necessary
    if (argv.clean === true) {
      rimraf(argv.sourcePath, {}, (error) => {
        if (error) throw error;
        console.log(`Removed source directory: ${argv.sourcePath}`);
      });
    }
  });
});