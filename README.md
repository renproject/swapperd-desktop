# Building the project

```bash
git clone https://github.com/republicprotocol/swapperd-native
cd swapperd-native
npm install
npm run build
cd build
npm install
npm run build
```

# Packaging the project

## Building for Mac

After building and in the ./build directory, run:

```bash
npm run package-mac
npm run create-installer-mac
```
