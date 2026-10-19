import * as vscode from 'vscode';
import './ai';
import { LecodesController } from './controller';

export function activate(context: vscode.ExtensionContext): void {
	const controller = new LecodesController(context);

	context.subscriptions.push(
		controller,
		vscode.commands.registerCommand('lecodes.preview.open', () => controller.openPreview()),
		vscode.commands.registerCommand('lecodes.preview.reload', () => controller.reloadPreview()),
		vscode.commands.registerCommand('lecodes.preview.stop', () => controller.stop()),
		vscode.commands.registerCommand('lecodes.qr.show', () => controller.showQr()),
		vscode.commands.registerCommand('lecodes.logs.show', () => controller.showLogs()),
	);
}

export function deactivate(): void {}
