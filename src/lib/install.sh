#!/bin/sh

generate_plist()
{
echo "<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">
<plist version=\"1.0\">
  <dict>
    <key>Label</key>
    <string>ren.swapperd</string>
    <key>ProgramArguments</key>
    <array>
        <string>$HOME/.swapperd/bin/swapperd</string>
    </array>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$HOME/.swapperd/swapperd.log</string>
    <key>StandardErrorPath</key>
    <string>$HOME/.swapperd/swapperd.log</string>
  </dict>
</plist>" > "$HOME/Library/LaunchAgents/ren.swapperd.plist"
}

generate_service()
{
mkdir -p $HOME/.config/systemd/user
echo "[Unit]
Description=Swapper Daemon
AssertPathExists=$HOME/.swapperd

[Service]
WorkingDirectory=$HOME/.swapperd
ExecStart=$HOME/.swapperd/bin/swapperd
Restart=on-failure
PrivateTmp=true
NoNewPrivileges=true

# Specifies which signal to use when killing a service. Defaults to SIGTERM.
# SIGHUP gives parity time to exit cleanly before SIGKILL (default 90s)
KillSignal=SIGHUP

[Install]
WantedBy=default.target" > swapperd.service
mv swapperd.service $HOME/.config/systemd/user/swapperd.service
}

# install unzip if command not found
if ! [ -x "$(command -v unzip)" ];then
  echo "please install unzip"
  exit 0
fi

# creating working directory
mkdir -p $HOME/.swapperd
cd $HOME/.swapperd

# get system information
ostype="$(uname -s)"
cputype="$(uname -m)"

# download swapperd binary depending on the system and architecture
if [ "$ostype" = 'Linux' -a "$cputype" = 'x86_64' ]; then
  curl -s 'https://releases.republicprotocol.com/swapperd/0.2.0/swapper_linux_amd64.zip' > swapper.zip
elif [ "$ostype" = 'Darwin' -a "$cputype" = 'x86_64' ]; then
  curl -s 'https://releases.republicprotocol.com/swapperd/0.2.0/swapper_darwin_amd64.zip' > swapper.zip
else
  echo 'unsupported OS type or architecture'
  cd ..
  rm -rf .swapperd
  exit 1
fi

unzip -o swapper.zip
chmod +x bin/swapperd
chmod +x bin/installer

./bin/installer --network $1 --username $2 --password $3

# make sure the swapper service is started when booted
if [ "$ostype" = 'Linux' -a "$cputype" = 'x86_64' ]; then
  generate_service
  systemctl --user enable swapperd.service
  systemctl --user start swapperd.service
elif [ "$ostype" = 'Darwin' -a "$cputype" = 'x86_64' ]; then
  generate_plist
  chmod +x "$HOME/Library/LaunchAgents/ren.swapperd.plist"
  if [ "$(launchctl list | grep ren.swapperd | wc -l)" -ge 1 ]; then
    launchctl unload -w "$HOME/Library/LaunchAgents/ren.swapperd.plist"
  fi
  launchctl load -w "$HOME/Library/LaunchAgents/ren.swapperd.plist"
else
  echo 'unsupported OS type or architecture'
  cd ..
  rm -rf "$HOME/.swapperd"
  exit 1
fi

# clean up
rm swapper.zip
rm bin/installer

mkdir -p $HOME/.swapperd_backup
cp $HOME/.swapperd/testnet.json $HOME/.swapperd_backup/testnet-$(timestamp).json

echo "Swapperd is installed now. Great!"