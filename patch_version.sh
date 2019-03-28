#!/bin/sh

patch_version() {
  branch=$(git branch | grep \* | cut -d ' ' -f2)
  timestamp=$(date +"%y%m%d")
  tmp=$(mktemp)
  cat $1 | suffix="-${branch}.${timestamp}" yarn --silent jqn --color=false --require process 'update("version", (v) => v+process.env.suffix)' > "$tmp" && mv -f "$tmp" $1
}

patch_version $@

