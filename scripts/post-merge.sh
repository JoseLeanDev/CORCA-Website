#!/bin/bash
set -e
pnpm install --frozen-lockfile
node artifacts/corca-website/scripts/check-static.mjs
