import { spawn, type ChildProcess } from 'node:child_process';
import * as vscode from 'vscode';
import { readConfig } from '../config';
import { stripAnsi } from '../ansi';
import { appendLog } from '../logs/output';
import { finalizeEndpoints, parseDevChunk, type DevEndpoints } from './parser';

export type DevStatus = 'idle' | 'starting' | 'running' | 'stopping' | 'error';

export class DevServer implements vscode.Disposable {
	private child: ChildProcess | undefined;
	private endpoints: DevEndpoints = {};
	private status: DevStatus = 'idle';
	private readonly _onDidChangeEndpoints = new vscode.EventEmitter<DevEndpoints>();
	private readonly _onDidChangeStatus = new vscode.EventEmitter<DevStatus>();
	private readonly _onLog = new vscode.EventEmitter<string>();

	readonly onDidChangeEndpoints = this._onDidChangeEndpoints.event;
	readonly onDidChangeStatus = this._onDidChangeStatus.event;
	readonly onLog = this._onLog.event;

	get currentEndpoints(): DevEndpoints {
		return this.endpoints;
	}

	get currentStatus(): DevStatus {
		return this.status;
	}

	async start(cwd: string): Promise<DevEndpoints> {
		if (this.child && this.status === 'running') {
			return finalizeEndpoints(this.endpoints, readConfig().devPort);
		}
		if (this.child) {
			await this.stop();
		}

		const cfg = readConfig();
		const cli = resolveCliPath(cfg.cliPath);
		const args = ['dev', '--port', String(cfg.devPort)];
		if (cfg.openSystemBrowser) {
			args.push('--web');
		}

		this.endpoints = {};
		this.setStatus('starting');
		appendLog(`$ ${cli} ${args.join(' ')}`);
		appendLog(`cwd: ${cwd}`);

		const child = spawn(cli, args, {
			cwd,
			env: { ...process.env, FORCE_COLOR: '0' },
			shell: process.platform === 'win32',
			windowsHide: true,
			stdio: ['ignore', 'pipe', 'pipe'],
		});

		this.child = child;

		return await new Promise<DevEndpoints>((resolve, reject) => {
			let settled = false;
			let buffer = '';

			const timer = setTimeout(() => {
				if (settled) {
					return;
				}
				settled = true;
				const ready = finalizeEndpoints(this.endpoints, cfg.devPort);
				this.endpoints = ready;
				this.setStatus('running');
				this._onDidChangeEndpoints.fire(ready);
				resolve(ready);
			}, 8000);

			const onData = (chunk: Buffer) => {
				const text = stripAnsi(chunk.toString('utf8'));
				buffer += text;
				const lines = buffer.split(/\r?\n/);
				buffer = lines.pop() ?? '';
				for (const line of lines) {
					if (line.length === 0) {
						continue;
					}
					appendLog(line);
					this._onLog.fire(line);
				}
				if (parseDevChunk(text, this.endpoints) && !settled && (this.endpoints.previewUrl || this.endpoints.lanOrigin || this.endpoints.localOrigin)) {
					settled = true;
					clearTimeout(timer);
					const ready = finalizeEndpoints(this.endpoints, cfg.devPort);
					this.endpoints = ready;
					this.setStatus('running');
					this._onDidChangeEndpoints.fire(ready);
					resolve(ready);
				}
			};

			child.stdout?.on('data', onData);
			child.stderr?.on('data', onData);

			child.on('error', (err) => {
				if (settled) {
					appendLog(`lecodes: ${err.message}`, true);
					return;
				}
				settled = true;
				clearTimeout(timer);
				this.setStatus('error');
				reject(err);
			});

			child.on('exit', (code, signal) => {
				const msg = `lecodes dev exited (${code ?? signal ?? 'unknown'})`;
				appendLog(msg);
				this.child = undefined;
				this.setStatus(code === 0 ? 'idle' : 'error');
				if (!settled) {
					settled = true;
					clearTimeout(timer);
					reject(new Error(msg));
				}
			});
		});
	}

	async stop(): Promise<void> {
		const child = this.child;
		if (!child?.pid) {
			this.setStatus('idle');
			return;
		}
		this.setStatus('stopping');
		await killProcessTree(child);
		this.child = undefined;
		this.setStatus('idle');
	}

	dispose(): void {
		void this.stop();
		this._onDidChangeEndpoints.dispose();
		this._onDidChangeStatus.dispose();
		this._onLog.dispose();
	}

	private setStatus(status: DevStatus): void {
		this.status = status;
		this._onDidChangeStatus.fire(status);
	}
}

export function resolveCliPath(configured: string): string {
	if (configured) {
		return configured;
	}
	return process.platform === 'win32' ? 'lecodes.cmd' : 'lecodes';
}

function killProcessTree(child: ChildProcess): Promise<void> {
	return new Promise((resolve) => {
		const done = () => resolve();
		child.once('exit', done);
		if (process.platform === 'win32' && child.pid) {
			spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
				shell: true,
				windowsHide: true,
				stdio: 'ignore',
			}).on('exit', () => {
				try {
					child.kill();
				} catch {
					/* already gone */
				}
			});
		} else {
			child.kill('SIGTERM');
			setTimeout(() => {
				try {
					child.kill('SIGKILL');
				} catch {
					/* already gone */
				}
			}, 1500).unref();
		}
		setTimeout(done, 3000).unref();
	});
}
