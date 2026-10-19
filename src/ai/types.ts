/**
 * Placeholder for a future in-editor agent.
 * This iteration must not call any API or run arbitrary commands.
 */
export interface AiMessage {
	role: 'user' | 'assistant' | 'system';
	content: string;
}

export interface AiFileEdit {
	path: string;
	contents: string;
}

export interface AiClient {
	readonly id: string;
	chat(messages: AiMessage[]): Promise<string>;
	proposeEdits(prompt: string): Promise<AiFileEdit[]>;
}
