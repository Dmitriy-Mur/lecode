/** Strip ANSI / VT sequences so Output Channel and URL parsing stay readable. */
export function stripAnsi(text: string): string {
	return text
		.replace(/\u001b\[[0-9;?]*[ -/]*[@-~]/g, '')
		.replace(/\u001b\][^\u0007]*\u0007/g, '')
		.replace(/\u001b[PX^_].*?\u001b\\/g, '');
}
