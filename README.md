# Simple Offline AI Notes App

A simple offline AI notes app using all-minilm-l6-v2 to encode notes, storing the vectors in sqlite-vss for search. Built with Electron, Vite, Tailwind, Drizzle, SQLite, Flask, SBERT. Notes and encoding are all offline so there's no risk of leaking personal information.

## Usage

```
wget https://github.com/indygreg/python-build-standalone/releases/download/20240415/cpython-3.10.14+20240415-x86_64-apple-darwin-install_only.tar.gz
tar -xzvf cpython-3.10.14+20240415-x86_64-apple-darwin-install_only.tar.gz

pnpm i

pnpm drizzle-kit generate:sqlite

pnpm dev
```
