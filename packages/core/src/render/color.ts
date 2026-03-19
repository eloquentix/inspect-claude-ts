export const ansiReset = '\x1b[0m';
export const ansiBold = '\x1b[1m';
export const ansiDim = '\x1b[2m';
export const ansiCyan = '\x1b[36m';
export const ansiGreen = '\x1b[32m';
export const ansiYellow = '\x1b[33m';
export const ansiMagenta = '\x1b[35m';
export const ansiRed = '\x1b[31m';
export const ansiReverse = '\x1b[7m';

let colorEnabled = true;

export function initColor(): void {
  if (process.env['NO_COLOR'] !== undefined) {
    colorEnabled = false;
    return;
  }
  if (!process.stdout.isTTY) {
    colorEnabled = false;
  }
}

export function setColor(enabled: boolean): void {
  colorEnabled = enabled;
}

export function colorize(code: string, text: string): string {
  if (!colorEnabled) return text;
  return code + text + ansiReset;
}

export function isColorEnabled(): boolean {
  return colorEnabled;
}
