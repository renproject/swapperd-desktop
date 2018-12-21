const fs = require("fs");
const path = require("path");
const Mustache = require("mustache");
const InnoCompiler = require("innosetup-compiler");
const request = require("request");
const rimraf = require("rimraf");
const extract = require("extract-zip");

var argv = require('minimist')(process.argv.slice(2));

const appName = process.env.npm_package_productName;
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
  packageName: appName,
  appDir: argv.sourcePath,
};

var templateFile = "./template.iss";
var templatePath = path.join(path.dirname(__filename), templateFile);
var template = fs.readFileSync(templatePath).toString();

var tempZipFile = path.resolve(path.join("./", "swapper.zip"))

function downloadAndUnzip(url, extractPath, cb) {
  console.log(`Downloading ${url} to ${tempZipFile}`);
  request(url)
    .on("error", (error) => {
      console.error(`Failed to download ${url}, with error: ${error}. Are you connected to the internet?`);
    })
    .on("end", () => {
      console.log(`Finished downloading. Extracting ${tempZipFile} to ${extractPath}`);
      extract(tempZipFile, { dir: extractPath }, (error) => {
        if (error) throw error;
        console.log(`Finished extracting.`);
        if (cb) {
          cb();
        }
      });
    })
    .pipe(fs.createWriteStream(tempZipFile));
}

function main() {
  // Write the template to an actual file
  var output = Mustache.render(template, options);
  var finalISS = "tmp-generated-installer-script.iss";
  fs.writeFileSync(finalISS, output);
  // Successfully wrote. Now try to compile...
  console.log(`Generated ${finalISS}. Compiling into an installer...`);
  InnoCompiler(finalISS, {
    O: outPath,
    gui: false,
    verbose: false,
  }, (error) => {
    if (error) throw error;

    // Successfully compiled
    console.log(`Wrote Windows installer to: ${path.resolve(`${outPath}/${options.outputFilename}.exe`)}`);

    // Remove the ISS file
    rimraf(finalISS, {}, (error) => {
      if (error) throw error;
      console.log(`Removed temporary installer script: ${path.resolve(finalISS)}`);
    });

    // Remove the temporary zip file
    rimraf(tempZipFile, {}, (error) => {
      if (error) throw error;
      console.log(`Removed swapper zip download: ${path.resolve(tempZipFile)}`);
    });

    // Clean up source code if necessary
    if (argv.clean === true) {
      rimraf(argv.sourcePath, {}, (error) => {
        if (error) throw error;
        console.log(`Removed source directory: ${path.resolve(argv.sourcePath)}`);
      });
    }
  });
}

const dlPath = process.env.npm_package_config_winSwapperBin;
downloadAndUnzip(dlPath, path.resolve(argv.sourcePath), main);
