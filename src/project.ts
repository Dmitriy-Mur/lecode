import * as vscode from 'vscode';
import * as path from 'node:path';
import * as fs from 'node:fs';

const MARKERS = ['app.json', 'main.ts'];

export async function findProjectRoot(): Promise<string | undefined> {
	const folders = vscode.workspace.workspaceFolders;
	if (!folders?.length) {
		return undefined;
	}

	const active = vscode.window.activeTextEditor?.document.uri;
	if (active?.scheme === 'file') {
		const fromFile = walkUp(path.dirname(active.fsPath), folders);
		if (fromFile) {
			return fromFile;
		}
	}

	for (const folder of folders) {
		if (looksLikeProject(folder.uri.fsPath)) {
			return folder.uri.fsPath;
		}
		const nested = await findNestedProject(folder.uri);
		if (nested) {
			return nested;
		}
	}

	return folders[0].uri.fsPath;
}

function walkUp(start: string, folders: readonly vscode.WorkspaceFolder[]): string | undefined {
	const roots = new Set(folders.map((f) => path.normalize(f.uri.fsPath)));
	let dir = path.normalize(start);
	for (;;) {
		if (looksLikeProject(dir)) {
			return dir;
		}
		const parent = path.dirname(dir);
		if (parent === dir || !isInsideAnyRoot(dir, roots)) {
			return undefined;
		}
		dir = parent;
	}
}

function isInsideAnyRoot(dir: string, roots: Set<string>): boolean {
	for (const root of roots) {
		const rel = path.relative(root, dir);
		if (rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel))) {
			return true;
		}
	}
	return false;
}

function looksLikeProject(dir: string): boolean {
	return MARKERS.some((name) => fs.existsSync(path.join(dir, name)));
}

async function findNestedProject(folder: vscode.Uri): Promise<string | undefined> {
	const hits = await vscode.workspace.findFiles(
		new vscode.RelativePattern(folder, '**/app.json'),
		'**/{node_modules,dist,out,.git}/**',
		4,
	);
	return hits[0] ? path.dirname(hits[0].fsPath) : undefined;
}
