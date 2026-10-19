import * as vscode from 'vscode';
import type { DevStatus } from '../dev/DevServer';

export class StatusBar implements vscode.Disposable {
	private readonly preview: vscode.StatusBarItem;
	private readonly qr: vscode.StatusBarItem;

	constructor() {
		this.preview = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 80);
		this.qr = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 79);
		this.qr.command = 'lecodes.qr.show';
		this.qr.text = '$(qrcode)';
		this.qr.tooltip = 'Show pairing QR code';
		this.setStatus('idle');
		this.preview.show();
		this.qr.show();
	}

	setStatus(status: DevStatus, port?: number): void {
		const label = port ? `:${port}` : '';
		this.preview.command = 'lecodes.preview.open';
		switch (status) {
			case 'starting':
				this.preview.text = `$(loading~spin) LeCodes${label}`;
				this.preview.tooltip = 'Starting lecodes dev';
				break;
			case 'running':
				this.preview.text = `$(device-mobile) LeCodes${label}`;
				this.preview.tooltip = 'Open LeCodes preview';
				break;
			case 'error':
				this.preview.text = '$(error) LeCodes';
				this.preview.tooltip = 'lecodes dev failed — open logs';
				this.preview.command = 'lecodes.logs.show';
				break;
			default:
				this.preview.text = '$(device-mobile) LeCodes';
				this.preview.tooltip = 'Open LeCodes preview';
		}
	}

	dispose(): void {
		this.preview.dispose();
		this.qr.dispose();
	}
}
