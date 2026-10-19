import { DEVICE_PRESETS } from './presets';

export function previewHtml(opts: {
	cspSource: string;
	nonce: string;
	previewUrl: string;
}): string {
	const presetsJson = JSON.stringify(DEVICE_PRESETS);
	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'none';
    img-src ${opts.cspSource} data: https:;
    style-src ${opts.cspSource} 'unsafe-inline';
    script-src 'nonce-${opts.nonce}';
    frame-src http://127.0.0.1:* http://localhost:* http://[::1]:*;
    connect-src http://127.0.0.1:* http://localhost:* http://[::1]:* ws://127.0.0.1:* ws://localhost:* ws://[::1]:*;
  " />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>LeCodes Preview</title>
  <style>
    :root {
      --bg: var(--vscode-editor-background, #111);
      --fg: var(--vscode-foreground, #ddd);
      --muted: var(--vscode-descriptionForeground, #888);
      --btn: var(--vscode-button-background, #3d6);
      --btn-fg: var(--vscode-button-foreground, #111);
      --input: var(--vscode-input-background, #1e1e1e);
      --border: var(--vscode-input-border, #444);
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0; height: 100%;
      background: var(--bg); color: var(--fg);
      font: 12px/1.4 var(--vscode-font-family, system-ui);
    }
    .toolbar {
      display: flex; flex-wrap: wrap; gap: 8px; align-items: center;
      padding: 8px 12px;
      border-bottom: 1px solid var(--border);
      position: sticky; top: 0; z-index: 2;
      background: var(--bg);
    }
    .toolbar label { color: var(--muted); display: flex; align-items: center; gap: 4px; }
    button, select, input {
      background: var(--input); color: var(--fg);
      border: 1px solid var(--border); border-radius: 4px;
      padding: 4px 8px; font: inherit;
    }
    button.primary { background: var(--btn); color: var(--btn-fg); border-color: transparent; }
    button:hover { filter: brightness(1.1); cursor: pointer; }
    input[type=number] { width: 64px; }
    .stage {
      height: calc(100% - 46px);
      overflow: auto;
      display: grid;
      place-items: center;
      padding: 32px 16px 48px;
    }
    .phone {
      position: relative;
      background: #0a0a0c;
      box-shadow: 0 24px 60px rgba(0,0,0,.45);
      transition: width .2s ease, height .2s ease, border-radius .2s ease;
    }
    .screen {
      position: absolute; overflow: hidden; background: #000;
    }
    .screen iframe {
      width: 100%; height: 100%; border: 0; display: block; background: #000;
    }
    .phone.ios {
      border-radius: 48px;
      padding: 14px;
      background: linear-gradient(160deg, #2a2a2e, #111);
      border: 1px solid #3a3a40;
    }
    .phone.ios .screen { inset: 14px; border-radius: 36px; }
    .island {
      display: none; position: absolute; top: 22px; left: 50%; transform: translateX(-50%);
      width: 92px; height: 28px; background: #000; border-radius: 20px; z-index: 3;
    }
    .phone.ios .island { display: block; }
    .home-bar {
      display: none; position: absolute; bottom: 22px; left: 50%; transform: translateX(-50%);
      width: 120px; height: 5px; background: rgba(255,255,255,.35); border-radius: 4px; z-index: 3;
    }
    .phone.ios .home-bar { display: block; }
    .phone.android {
      border-radius: 36px; padding: 12px 10px 18px;
      background: #1a1c1e; border: 2px solid #2c2f33;
    }
    .phone.android .screen { inset: 12px 10px 18px; border-radius: 24px; }
    .punch {
      display: none; position: absolute; top: 18px; left: 50%; transform: translateX(-50%);
      width: 12px; height: 12px; background: #111; border-radius: 50%;
      box-shadow: 0 0 0 3px #1a1c1e; z-index: 3;
    }
    .phone.android .punch { display: block; }
    .phone.abstract {
      border-radius: 20px; padding: 10px;
      background: #222; border: 1px solid #555;
    }
    .phone.abstract .screen { inset: 10px; border-radius: 12px; }
    .status {
      margin-left: auto; color: var(--muted); max-width: 40%;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button class="primary" id="reload">Reload</button>
    <button id="rotate">Rotate</button>
    <button id="qr">QR</button>
    <label>Device
      <select id="preset"></select>
    </label>
    <label>Shell
      <select id="shell">
        <option value="ios">iOS</option>
        <option value="android">Android</option>
        <option value="abstract">Abstract</option>
      </select>
    </label>
    <label>W <input id="w" type="number" min="240" max="1400" /></label>
    <label>H <input id="h" type="number" min="240" max="1400" /></label>
    <span class="status" id="status">starting…</span>
  </div>
  <div class="stage">
    <div class="phone ios" id="phone">
      <div class="island"></div>
      <div class="punch"></div>
      <div class="screen">
        <iframe id="frame" src="${escapeAttr(opts.previewUrl)}" allow="autoplay; clipboard-read; clipboard-write"></iframe>
      </div>
      <div class="home-bar"></div>
    </div>
  </div>
  <script nonce="${opts.nonce}">
    const vscode = acquireVsCodeApi();
    const presets = ${presetsJson};
    const phone = document.getElementById('phone');
    const frame = document.getElementById('frame');
    const presetEl = document.getElementById('preset');
    const shellEl = document.getElementById('shell');
    const wEl = document.getElementById('w');
    const hEl = document.getElementById('h');
    const statusEl = document.getElementById('status');

    let landscape = false;
    let width = 393;
    let height = 852;
    let shell = 'ios';

    for (const p of presets) {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.label;
      presetEl.appendChild(opt);
    }
    presetEl.value = 'iphone-15';

    function apply() {
      const cw = landscape ? height : width;
      const ch = landscape ? width : height;
      phone.style.width = (cw + bezel()) + 'px';
      phone.style.height = (ch + bezel()) + 'px';
      phone.className = 'phone ' + shell;
      shellEl.value = shell;
      wEl.value = String(width);
      hEl.value = String(height);
    }

    function bezel() {
      if (shell === 'ios') return 28;
      if (shell === 'android') return 30;
      return 20;
    }

    document.getElementById('reload').addEventListener('click', () => {
      vscode.postMessage({ type: 'reload' });
    });
    document.getElementById('rotate').addEventListener('click', () => {
      landscape = !landscape;
      apply();
    });
    document.getElementById('qr').addEventListener('click', () => {
      vscode.postMessage({ type: 'qr' });
    });
    presetEl.addEventListener('change', () => {
      const p = presets.find((x) => x.id === presetEl.value);
      if (!p) { return; }
      width = p.width;
      height = p.height;
      shell = p.shell;
      landscape = false;
      apply();
    });
    shellEl.addEventListener('change', () => {
      shell = shellEl.value;
      apply();
    });
    wEl.addEventListener('change', () => { width = Number(wEl.value) || width; apply(); });
    hEl.addEventListener('change', () => { height = Number(hEl.value) || height; apply(); });

    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (!msg || typeof msg !== 'object') { return; }
      if (msg.type === 'setPreviewUrl' && msg.url) {
        frame.src = msg.url;
        statusEl.textContent = msg.url;
      }
      if (msg.type === 'reload') {
        try {
          frame.contentWindow.location.reload();
        } catch {
          frame.src = frame.src;
        }
      }
      if (msg.type === 'status') {
        statusEl.textContent = msg.text || '';
      }
    });

    apply();
    vscode.postMessage({ type: 'ready' });
  </script>
</body>
</html>`;
}

function escapeAttr(value: string): string {
	return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
