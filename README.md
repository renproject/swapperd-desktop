# Building the project

```bash
git clone https://github.com/republicprotocol/swapperd-native
cd swapperd-native
npm install
npm run build
```

# Packaging the project

After building the project, run:

```bash
cd build
npm install
npm run build
```

This will package the project for all supported platforms. All the build packages can be found in the `./release-builds` folder. To build for specific platforms, see below.

## Packaging for Mac

After building and in the ./build directory, run:

```bash
cd build
npm install
npm run build-mac
```

This will generate a `Swapperd.dmg` file in the "release-builds" folder.

## Packaging for Windows

After building and in the ./build directory, run:

```bash
cd build
npm install
npm run build-win
```

This will generate a `SwapperdInstaller.exe` file in the "release-builds" folder.

