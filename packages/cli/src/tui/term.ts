/** Key constants for readKey return values. */
export const KEY_UP = 256;
export const KEY_DOWN = 257;
export const KEY_RIGHT = 258;
export const KEY_LEFT = 259;
export const KEY_PGUP = 260;
export const KEY_PGDOWN = 261;
export const KEY_HOME = 262;
export const KEY_END = 263;

/**
 * Enable raw mode on stdin and return a restore function.
 */
export function enableRawMode(): () => void {
  if (!process.stdin.isTTY) {
    throw new Error('stdin is not a TTY');
  }
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  return () => {
    process.stdin.setRawMode(false);
    process.stdin.pause();
  };
}

/**
 * Get terminal dimensions.
 */
export function getTermSize(): { rows: number; cols: number } {
  return {
    rows: process.stdout.rows || 24,
    cols: process.stdout.columns || 80,
  };
}

/**
 * Read a single keypress. Returns a promise that resolves to a key code.
 * Arrow keys, page up/down, home/end return KEY_* constants.
 */
export function readKey(): Promise<number> {
  return new Promise(resolve => {
    const onData = (data: string) => {
      cleanup();

      if (data === '\x1b') {
        // Could be bare ESC or start of escape sequence
        // In raw mode, escape sequences arrive as one data event
        resolve(27);
        return;
      }

      if (data.length > 1 && data[0] === '\x1b' && data[1] === '[') {
        const rest = data.slice(2);
        // Numbered sequences like ESC[5~ (PgUp)
        if (rest.length >= 2 && rest[rest.length - 1] === '~') {
          const num = rest.slice(0, -1);
          switch (num) {
            case '5': resolve(KEY_PGUP); return;
            case '6': resolve(KEY_PGDOWN); return;
            case '1': resolve(KEY_HOME); return;
            case '4': resolve(KEY_END); return;
          }
          resolve(27);
          return;
        }
        switch (rest[0]) {
          case 'A': resolve(KEY_UP); return;
          case 'B': resolve(KEY_DOWN); return;
          case 'C': resolve(KEY_RIGHT); return;
          case 'D': resolve(KEY_LEFT); return;
          case 'H': resolve(KEY_HOME); return;
          case 'F': resolve(KEY_END); return;
        }
        resolve(27);
        return;
      }

      resolve(data.charCodeAt(0));
    };

    const cleanup = () => {
      process.stdin.removeListener('data', onData);
    };

    process.stdin.once('data', onData);
  });
}

// ANSI helpers
export function clearScreen(): void {
  process.stdout.write('\x1b[2J\x1b[H');
}

export function moveCursor(row: number, col: number): void {
  process.stdout.write(`\x1b[${row};${col}H`);
}

export function hideCursor(): void {
  process.stdout.write('\x1b[?25l');
}

export function showCursor(): void {
  process.stdout.write('\x1b[?25h');
}
