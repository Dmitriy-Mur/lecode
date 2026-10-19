export type ShellKind = 'ios' | 'android' | 'abstract';

export interface DevicePreset {
	id: string;
	label: string;
	width: number;
	height: number;
	shell: ShellKind;
}

export const DEVICE_PRESETS: DevicePreset[] = [
	{ id: 'iphone-15', label: 'iPhone 15', width: 393, height: 852, shell: 'ios' },
	{ id: 'iphone-se', label: 'iPhone SE', width: 375, height: 667, shell: 'ios' },
	{ id: 'pixel-8', label: 'Pixel 8', width: 412, height: 915, shell: 'android' },
	{ id: 'galaxy-s24', label: 'Galaxy S24', width: 360, height: 780, shell: 'android' },
	{ id: 'abstract', label: 'Abstract 390×844', width: 390, height: 844, shell: 'abstract' },
];
