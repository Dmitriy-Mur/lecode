import * as assert from 'assert';
import { finalizeEndpoints, parseDevChunk, type DevEndpoints } from '../dev/parser';

suite('Dev output parser', () => {
	test('extracts LAN connect URL and /web/ preview URL', () => {
		const acc: DevEndpoints = {};
		parseDevChunk(
			'listening on http://127.0.0.1:4499\nscan http://192.168.1.20:4499/\nweb http://127.0.0.1:4499/web/\n',
			acc,
		);
		const ready = finalizeEndpoints(acc, 4499);
		assert.strictEqual(ready.localOrigin, 'http://127.0.0.1:4499');
		assert.strictEqual(ready.previewUrl, 'http://127.0.0.1:4499/web/');
		assert.strictEqual(ready.connectUrl, 'http://192.168.1.20:4499/');
	});

	test('falls back to configured port', () => {
		const ready = finalizeEndpoints({}, 4499);
		assert.strictEqual(ready.previewUrl, 'http://127.0.0.1:4499/web/');
		assert.strictEqual(ready.connectUrl, 'http://127.0.0.1:4499/');
	});
});
