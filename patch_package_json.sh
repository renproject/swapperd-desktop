#!/bin/sh

BRANCH=$(git branch | grep \* | cut -d ' ' -f2)
HASH=$(git describe --always --long)
NIGHTLY_DOWNLOAD_URL="https://api.github.com/repos/renproject/swapperd/releases/tags/nightly"

patch_version() {
  tmp=$(mktemp)
  cat $1 | SUFFIX="-${BRANCH}-${HASH}" yarn --silent jqn --color=false --require process 'update("version", (v) => v+process.env.SUFFIX)' > "$tmp" && mv -f "$tmp" $1
}

patch_download_link() {
  tmp=$(mktemp)
  cat $1 | URL="${NIGHTLY_DOWNLOAD_URL}" yarn --silent jqn --color=false --require process 'update("config.swapperdReleasesUrl", (v) => process.env.URL)' > "$tmp" && mv -f "$tmp" $1
}

# patch version
patch_version $@

# patch download link if nightly branch
if [ "${BRANCH}" == "nightly" ]; then
  patch_download_link $@
fi
