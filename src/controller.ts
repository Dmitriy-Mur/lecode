import * as path from 'node:path';
import * as vscode from 'vscode';
import { readConfig } from './config';
import { DevServer } from './dev/DevServer';
import { appendLog, showLogs } from './logs/output';
import { PreviewPanel } from './preview/PreviewPanel';
import { findProjectRoot } from './project';
import { QrPanel } from './qr/QrPanel';
import { StatusBar } from './status/StatusBar';

export class LecodesController implements vscode.Disposable {
	private readonly server = new DevServer();
	private readonly preview: PreviewPanel;
	private readonly qr = new QrPanel();
	private readonly status = new StatusBar();
	private readonly disposables: vscode.Disposable[] = [];
	private fileWatcher: vscode.FileSystemWatcher | undefined;
	private reloadTimer: ReturnType<typeof setTimeout> | undefined;

	constructor(context: vscode.ExtensionContext) {
		this.preview = new PreviewPanel(context);
		this.disposables.push(
			this.server.onDidChangeStatus((s) => this.status.setStatus(s, readConfig().devPort)),
			this.server.onDidChangeEndpoints((ep) => {
				if (ep.previewUrl) {
					this.preview.setUrl(ep.previewUrl);
					this.preview.setStatus(ep.previewUrl);
				}
			}),
		);
	}

	async openPreview(): Promise<void> {
		const root = await findProjectRoot();
		if (!root) {
			void vscode.window.showErrorMessage('Open a folder that contains a LeCodes project (app.json or main.ts).');
			return;
		}

		const cfg = readConfig();
		this.status.setStatus('starting', cfg.devPort);
		appendLog('--- lecodes preview ---');

		try {
			const endpoints = await this.server.start(root);
			const previewUrl = endpoints.previewUrl ?? `http://127.0.0.1:${cfg.devPort}/web/`;
			this.preview.reveal(previewUrl);
			this.preview.setStatus(previewUrl);
			this.hookAutoReload();
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			appendLog(message, true);
			this.status.setStatus('error', cfg.devPort);
			void vscode.window.showErrorMessage(`Failed to start lecodes dev: ${message}`);
		}
	}

	reloadPreview(): void {
		this.preview.reload();
	}

	async showQr(): Promise<void> {
		let connect = this.server.currentEndpoints.connectUrl;
		if (!connect) {
			await this.openPreview();
			connect = this.server.currentEndpoints.connectUrl;
		}
		if (!connect) {
			void vscode.window.showWarningMessage('Dev server URL is not available yet. Check LeCodes logs.');
			return;
		}
		await this.qr.show(connect);
	}

	async stop(): Promise<void> {
		await this.server.stop();
		this.status.setStatus('idle');
	}

	showLogs(): void {
		showLogs();
	}

	dispose(): void {
		if (this.reloadTimer) {
			clearTimeout(this.reloadTimer);
		}
		this.fileWatcher?.dispose();
		for (const d of this.disposables) {
			d.dispose();
		}
		this.server.dispose();
		this.preview.dispose();
		this.qr.dispose();
		this.status.dispose();
	}

	private hookAutoReload(): void {
		if (this.fileWatcher || !readConfig().autoReload) {
			return;
		}
		const watcher = vscode.workspace.createFileSystemWatcher('**/*.{ts,tsx,js,json,css}');
		const bump = (uri: vscode.Uri) => {
			if (uri.fsPath.split(path.sep).includes('node_modules')) {
				return;
			}
			if (this.reloadTimer) {
				clearTimeout(this.reloadTimer);
			}
			this.reloadTimer = setTimeout(() => this.preview.reload(), 500);
		};
		watcher.onDidChange(bump);
		watcher.onDidCreate(bump);
		watcher.onDidDelete(bump);
		this.fileWatcher = watcher;
	}
}
