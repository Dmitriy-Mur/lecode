import * as vscode from 'vscode';
import * as QRCode from 'qrcode';

export class QrPanel {
	private panel: vscode.WebviewPanel | undefined;

	async show(connectUrl: string): Promise<void> {
		const dataUrl = await QRCode.toDataURL(connectUrl, {
			margin: 1,
			width: 320,
			errorCorrectionLevel: 'M',
		});

		if (this.panel) {
			this.panel.reveal(vscode.ViewColumn.Beside);
			this.panel.webview.html = this.html(this.panel.webview, connectUrl, dataUrl);
			return;
		}

		const panel = vscode.window.createWebviewPanel(
			'lecodes.qr',
			'LeCodes QR',
			vscode.ViewColumn.Beside,
			{ enableScripts: false },
		);
		this.panel = panel;
		panel.webview.html = this.html(panel.webview, connectUrl, dataUrl);
		panel.onDidDispose(() => {
			this.panel = undefined;
		});
	}

	dispose(): void {
		this.panel?.dispose();
	}

	private html(webview: vscode.Webview, url: string, dataUrl: string): string {
		const escaped = url.replace(/&/g, '&amp;').replace(/</g, '&lt;');
		return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} data:; style-src 'unsafe-inline';" />
  <style>
    body {
      margin: 0; min-height: 100vh; display: grid; place-items: center;
      background: var(--vscode-editor-background); color: var(--vscode-foreground);
      font: 13px var(--vscode-font-family, system-ui); text-align: center;
    }
    img { width: 280px; height: 280px; background: #fff; padding: 12px; border-radius: 12px; }
    p { max-width: 360px; word-break: break-all; opacity: .8; }
  </style>
</head>
<body>
  <div>
    <img src="${dataUrl}" alt="QR code" />
    <p>Scan with the LeCodes app</p>
    <p>${escaped}</p>
  </div>
</body>
</html>`;
	}
}
