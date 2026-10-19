import * as vscode from 'vscode';
import { previewHtml } from './html';

export class PreviewPanel {
	public static readonly viewType = 'lecodes.preview';
	private panel: vscode.WebviewPanel | undefined;
	private previewUrl = '';

	constructor(private readonly context: vscode.ExtensionContext) {}

	reveal(previewUrl: string): vscode.WebviewPanel {
		this.previewUrl = previewUrl;
		if (this.panel) {
			this.panel.reveal(vscode.ViewColumn.Beside);
			this.post({ type: 'setPreviewUrl', url: previewUrl });
			return this.panel;
		}

		const panel = vscode.window.createWebviewPanel(
			PreviewPanel.viewType,
			'LeCodes Preview',
			{ viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
			{
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: [this.context.extensionUri],
			},
		);
		this.panel = panel;
		panel.iconPath = undefined;
		panel.webview.html = this.render(panel.webview, previewUrl);

		panel.webview.onDidReceiveMessage((msg) => {
			if (msg?.type === 'reload') {
				this.reload();
			}
			if (msg?.type === 'qr') {
				void vscode.commands.executeCommand('lecodes.qr.show');
			}
		});

		panel.onDidDispose(() => {
			this.panel = undefined;
		});

		return panel;
	}

	reload(): void {
		this.post({ type: 'reload' });
	}

	setUrl(url: string): void {
		this.previewUrl = url;
		if (!this.panel) {
			return;
		}
		this.post({ type: 'setPreviewUrl', url });
	}

	setStatus(text: string): void {
		this.post({ type: 'status', text });
	}

	dispose(): void {
		this.panel?.dispose();
	}

	private render(webview: vscode.Webview, previewUrl: string): string {
		const nonce = getNonce();
		return previewHtml({
			cspSource: webview.cspSource,
			nonce,
			previewUrl,
		});
	}

	private post(message: Record<string, unknown>): void {
		void this.panel?.webview.postMessage(message);
	}
}

function getNonce(): string {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let text = '';
	for (let i = 0; i < 32; i++) {
		text += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return text;
}
