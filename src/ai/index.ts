import type { AiClient, AiFileEdit, AiMessage } from './types';

export type { AiClient, AiFileEdit, AiMessage };

/** No-op client. Wire a real backend here later without touching Preview/DevServer. */
export class StubAiClient implements AiClient {
	readonly id = 'stub';

	async chat(_messages: AiMessage[]): Promise<string> {
		return 'AI chat is not enabled in this prototype.';
	}

	async proposeEdits(_prompt: string): Promise<AiFileEdit[]> {
		return [];
	}
}

export function createAiClient(): AiClient {
	return new StubAiClient();
}
