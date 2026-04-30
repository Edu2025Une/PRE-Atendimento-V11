#!/bin/bash
set -e

# Install Express server dependencies (root)
npm install

# Install frontend workspace dependencies (artifacts/main-app via pnpm)
pnpm install
