#!/bin/sh

BRANCH=$(git branch | grep \* | cut -d ' ' -f2)
HASH=$(git describe --always --long)

patch_version() {
  tmp=$(mktemp)
  cat $1 | SUFFIX="-${BRANCH}-${HASH}" yarn --silent jqn --color=false --require process 'update("version", (v) => v+process.env.SUFFIX)' > "$tmp" && mv -f "$tmp" $1
}

# patch version
patch_version $@

