# LeCodes for VS Code

Live phone-frame preview, pairing QR and `lecodes dev` logs for local LeCodes projects. Requires the `lecodes` CLI (`npm i -g lecodes-cli`, Node ≥ 18) and a project with `app.json` / `main.ts`.

## Commands

- **LeCodes: Open Preview** — starts `lecodes dev --port <n>` and opens a WebView with the web player (`http://127.0.0.1:<port>/web/`) inside a device shell.
- **LeCodes: Show QR Code** — QR for the LAN URL; scan it with the LeCodes app.
- **LeCodes: Reload Preview** — reloads the iframe (also on file save if `lecodes.preview.autoReload` is on).
- **LeCodes: Show Logs** / **Stop Dev Server** — Output Channel `LeCodes` and process lifecycle.

The system browser is **not** opened unless `lecodes.preview.openSystemBrowser` is true (adds `--web`).

## Settings

| Setting | Default | Meaning |
|---|---|---|
| `lecodes.cliPath` | *(PATH)* | Path to the `lecodes` binary |
| `lecodes.devPort` | `4499` | `--port` for `lecodes dev` |
| `lecodes.preview.autoReload` | `true` | Reload iframe when `*.ts` / `*.json` change |
| `lecodes.preview.openSystemBrowser` | `false` | Also pass `--web` |

## Debug the extension

`F5` → Extension Development Host → open a LeCodes app folder → **LeCodes: Open Preview**.
