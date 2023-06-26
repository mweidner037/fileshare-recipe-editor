# Fileshare Recipe Editor

Collaborative rich text editor that syncs over Dropbox.

Specifically, it autosaves its state to files in `~/Dropbox/Files/fileshare-recipe-editor/`. Each device writes to its own file; whenever you start the app or a file changes, the app "merges" every file's contents using [Collabs](https://collabs.readthedocs.io/en/latest/). As a result, there are no sync conflicts, and all devices' (or collaborators') edits are preserved.

Talk slides featuring this app are [here](https://docs.google.com/presentation/d/13I3L76R-wwiXxgTXI2ide3zlbjiWoTWXMSU9YbQdYXU/edit?usp=sharing).

## Files

- `src/main`: Main process. Entry point is `main.ts`. Built to `build/main`.
- `src/renderer`: Renderer process. HTML entry point is `static/index.html`; TypeScript entry point is `script/renderer.tsx`. The static folder's contents are copied to `build/renderer`, together with Webpack's output bundle.

## Commands

Install dependencies: `npm i`.

Development mode:

- Build with `npm run build`. Note this uses Webpack development mode.
- Run with `npm start`.

Production mode:

- Configure an appropriate [maker](https://www.electronforge.io/config/makers) in `package.json` (default: `.deb` only).
- Build and package with `npm run make`. Destination folder is `out/`. Note this uses Webpack production mode.
- Run by installing the install file for your platform in `out/`.
