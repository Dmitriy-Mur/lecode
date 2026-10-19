import * as vscode from 'vscode';

let channel: vscode.OutputChannel | undefined;

export function getOutput(): vscode.OutputChannel {
	if (!channel) {
		channel = vscode.window.createOutputChannel('LeCodes');
	}
	return channel;
}

export function appendLog(line: string, reveal = false): void {
	const out = getOutput();
	out.appendLine(line);
	if (reveal) {
		out.show(true);
	}
}

export function showLogs(): void {
	getOutput().show(true);
}
