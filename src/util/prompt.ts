import readline from 'node:readline';
import { StringDecoder } from 'node:string_decoder';

export class PromptCancelled extends Error {
  constructor() {
    super('Cancelled.');
    this.name = 'PromptCancelled';
  }
}

/**
 * The terminal a prompt reads from and writes to. Injectable so the key
 * handling below can be tested without a pseudo-terminal.
 */
export interface PromptStreams {
  input: NodeJS.ReadableStream & {
    isTTY?: boolean;
    isRaw?: boolean;
    setRawMode?: (mode: boolean) => void;
    pause: () => unknown;
    resume: () => unknown;
  };
  output: NodeJS.WritableStream;
}

function terminal(): PromptStreams {
  return { input: process.stdin, output: process.stdout };
}

/**
 * Reads a line from the terminal.
 *
 * The question is handed to readline rather than written ourselves: on a real
 * terminal readline clears the current line before it draws, so anything we
 * print first is wiped and the prompt appears to hang with no visible text.
 *
 * Pass a signal to take the prompt down from elsewhere -- used when a login is
 * approved on a phone while the code prompt is still open.
 */
export function prompt(
  question: string,
  streams: PromptStreams = terminal(),
  signal?: AbortSignal,
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new PromptCancelled());
      return;
    }

    const rl = readline.createInterface({ input: streams.input, output: streams.output });

    let settled = false;
    const done = (finish: () => void): void => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener('abort', onAbort);
      rl.close();
      finish();
    };

    function onAbort(): void {
      done(() => {
        streams.output.write('\n');
        reject(new PromptCancelled());
      });
    }
    signal?.addEventListener('abort', onAbort, { once: true });

    rl.once('SIGINT', () => done(() => reject(new PromptCancelled())));
    // Closing without an answer means end of input, e.g. stdin reached EOF.
    // Rejecting keeps callers from looping on an endless run of empty answers.
    rl.once('close', () => done(() => reject(new PromptCancelled())));
    rl.question(question, (answer) => done(() => resolve(answer.trim())));
  });
}

/** Matches ANSI escape sequences, so arrow keys do not land in the value. */
const ESCAPE_SEQUENCE = /\u001b\[?[0-9;?]*[ -/]*[@-~]/g;

const ENTER = ['\r', '\n'];
const BACKSPACE = ['\b', '\u007f'];
const CTRL_C = '\u0003';
const CTRL_D = '\u0004';
const CTRL_U = '\u0015';
/** Erase one echoed character: step back, overwrite with a space, step back. */
const ERASE = '\b \b';

/**
 * Reads a line without echoing it, for passwords and passphrases.
 *
 * Keys are read in raw mode rather than by suppressing readline's echo, which
 * needs a private hook and behaves differently per platform. Each character is
 * acknowledged with an asterisk so it is obvious that typing is registering.
 */
export function promptSecret(
  question: string,
  streams: PromptStreams = terminal(),
): Promise<string> {
  const { input, output } = streams;

  // Piped input is not echoed in the first place, and raw mode is unavailable.
  if (!input.isTTY || typeof input.setRawMode !== 'function') {
    return prompt(question, streams);
  }
  const setRawMode = input.setRawMode.bind(input);

  return new Promise((resolve, reject) => {
    output.write(question);

    const wasRaw = input.isRaw === true;
    const decoder = new StringDecoder('utf8');
    let value = '';

    const settle = (finish: () => void): void => {
      input.removeListener('data', onData);
      setRawMode(wasRaw);
      input.pause();
      output.write('\n');
      finish();
    };

    function onData(chunk: Buffer | string): void {
      const text = typeof chunk === 'string' ? chunk : decoder.write(chunk);

      for (const char of text.replace(ESCAPE_SEQUENCE, '')) {
        if (ENTER.includes(char)) {
          settle(() => resolve(value));
          return;
        }
        if (char === CTRL_C) {
          settle(() => reject(new PromptCancelled()));
          return;
        }
        if (char === CTRL_D) {
          settle(() => (value ? resolve(value) : reject(new PromptCancelled())));
          return;
        }
        if (BACKSPACE.includes(char)) {
          if (value.length > 0) {
            value = value.slice(0, -1);
            output.write(ERASE);
          }
          continue;
        }
        if (char === CTRL_U) {
          output.write(ERASE.repeat(value.length));
          value = '';
          continue;
        }
        // Drop any remaining control characters; keep printable input.
        if (char >= ' ') {
          value += char;
          output.write('*');
        }
      }
    }

    setRawMode(true);
    input.resume();
    input.on('data', onData);
  });
}

export async function confirm(
  question: string,
  streams: PromptStreams = terminal(),
): Promise<boolean> {
  const answer = (await prompt(`${question} [y/N] `, streams)).toLowerCase();
  return answer === 'y' || answer === 'yes';
}
