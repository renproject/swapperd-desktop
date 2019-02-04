# Cloning the project

```bash
git clone https://github.com/republicprotocol/swapperd-native
cd swapperd-native
npm install
```

# Packaging for Mac

```bash
npm run build-mac
```

This will generate a `Swapperd.dmg` file in the `./release-builds/` folder.

# Packaging for Windows

You will need `wine` on your machine if building on a non-Windows operating systems.

```bash
npm run build-win
```

This will generate a `SwapperdInstaller.exe` file in the `./release-builds/` folder.


# Packaging for Debian

You will need `fakeroot`, and `dpkg` to build on non-Debian operating systems.

You can install this on Mac OS using:

```bash
brew install fakeroot dpkg
```

Once installed, you can build the Debian package using the following command:

```bash
npm run build-debian
```

This will generate a Debian installer package in the `./release-builds/` folder.
