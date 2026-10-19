import * as vscode from 'vscode';

export interface LecodesConfig {
	cliPath: string;
	devPort: number;
	autoReload: boolean;
	openSystemBrowser: boolean;
}

export function readConfig(): LecodesConfig {
	const cfg = vscode.workspace.getConfiguration('lecodes');
	return {
		cliPath: (cfg.get<string>('cliPath') ?? '').trim(),
		devPort: cfg.get<number>('devPort') ?? 4499,
		autoReload: cfg.get<boolean>('preview.autoReload') ?? true,
		openSystemBrowser: cfg.get<boolean>('preview.openSystemBrowser') ?? false,
	};
}
