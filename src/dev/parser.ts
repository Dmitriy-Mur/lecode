export interface DevEndpoints {
	/** URL the phone should scan (LAN origin). */
	connectUrl?: string;
	/** URL to embed in the preview iframe. */
	previewUrl?: string;
	localOrigin?: string;
	lanOrigin?: string;
}

const URL_RE = /https?:\/\/(?:localhost|127\.0\.0\.1|(?:\d{1,3}\.){3}\d{1,3})(?::\d+)?(?:\/[^\s"'<>]*)?/gi;

export function parseDevChunk(text: string, acc: DevEndpoints): boolean {
	const before = serialize(acc);
	const matches = text.match(URL_RE) ?? [];
	for (const raw of matches) {
		ingestUrl(raw.replace(/[),.;]+$/, ''), acc);
	}
	return serialize(acc) !== before;
}

function ingestUrl(raw: string, acc: DevEndpoints): void {
	let url: URL;
	try {
		url = new URL(raw);
	} catch {
		return;
	}

	const origin = url.origin;
	const host = url.hostname;
	const isLoopback = host === 'localhost' || host === '127.0.0.1';
	const pathname = url.pathname.replace(/\/+$/, '') || '/';

	if (isLoopback) {
		acc.localOrigin ??= origin;
	} else {
		acc.lanOrigin ??= origin;
		if (!pathname.startsWith('/web') && !pathname.startsWith('/lite') && pathname !== '/dev.js') {
			acc.connectUrl ??= origin + '/';
		}
	}

	if (pathname.startsWith('/web')) {
		acc.previewUrl ??= origin + '/web/';
	}
}

export function finalizeEndpoints(acc: DevEndpoints, fallbackPort: number): DevEndpoints {
	const local = acc.localOrigin ?? `http://127.0.0.1:${fallbackPort}`;
	const preview = acc.previewUrl ?? `${local}/web/`;
	const connect = acc.connectUrl ?? (acc.lanOrigin ? `${acc.lanOrigin}/` : `${local}/`);
	return {
		...acc,
		localOrigin: local,
		previewUrl: preview.endsWith('/') ? preview : `${preview}/`,
		connectUrl: connect,
	};
}

function serialize(acc: DevEndpoints): string {
	return `${acc.connectUrl}|${acc.previewUrl}|${acc.localOrigin}|${acc.lanOrigin}`;
}
