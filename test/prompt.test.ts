import { PassThrough } from 'node:stream';
import { describe, expect, it } from 'vitest';
import {
  confirm,
  prompt,
  PromptCancelled,
  promptSecret,
  type PromptStreams,
} from '../src/util/prompt.js';

interface Harness {
  streams: PromptStreams;
  /** Everything the prompt has written, escape sequences included. */
  written: () => string;
  send: (text: string) => void;
  rawModeCalls: boolean[];
}

function harness({ isTTY, ttyOutput }: { isTTY: boolean; ttyOutput?: boolean }): Harness {
  const input = new PassThrough() as PassThrough & {
    isTTY?: boolean;
    isRaw?: boolean;
    setRawMode?: (mode: boolean) => void;
  };
  // readline only performs its clear-and-redraw when the output is a terminal.
  const output = new PassThrough() as PassThrough & { isTTY?: boolean; columns?: number };
  if (ttyOutput) {
    output.isTTY = true;
    output.columns = 80;
  }
  const chunks: string[] = [];
  output.on('data', (chunk: Buffer) => chunks.push(chunk.toString('utf8')));

  const rawModeCalls: boolean[] = [];
  if (isTTY) {
    input.isTTY = true;
    input.isRaw = false;
    input.setRawMode = (mode: boolean) => {
      rawModeCalls.push(mode);
      input.isRaw = mode;
    };
  }

  return {
    streams: { input, output } as PromptStreams,
    written: () => chunks.join(''),
    send: (text: string) => input.write(Buffer.from(text, 'utf8')),
    rawModeCalls,
  };
}

/** Lets the prompt attach its listeners before the first keystroke arrives. */
const tick = () => new Promise((resolve) => setImmediate(resolve));

describe('prompt', () => {
  it('lets readline render the question so its redraw does not erase it', async () => {
    const io = harness({ isTTY: false });
    const answer = prompt('Steam account name: ', io.streams);
    await tick();
    io.send('petro\n');

    expect(await answer).toBe('petro');
    // The question must reach the terminal through readline, not a bare write
    // that readline would then clear.
    expect(io.written()).toContain('Steam account name: ');
  });

  it('survives the clear readline emits on a terminal', async () => {
    const io = harness({ isTTY: true, ttyOutput: true });
    const answer = prompt('Steam account name: ', io.streams);
    await tick();
    io.send('petro\n');
    await answer;

    const written = io.written();
    // readline clears to end of screen before drawing. Writing the question
    // ourselves put it before that clear, which wiped it and left the user
    // staring at an apparently dead prompt.
    const clearedAt = written.lastIndexOf('\u001b[0J');
    expect(clearedAt).toBeGreaterThanOrEqual(0);
    expect(written.indexOf('Steam account name: ')).toBeGreaterThan(clearedAt);
  });

  it('trims surrounding whitespace', async () => {
    const io = harness({ isTTY: false });
    const answer = prompt('name: ', io.streams);
    await tick();
    io.send('  petro  \n');
    expect(await answer).toBe('petro');
  });
});

describe('promptSecret on a terminal', () => {
  it('echoes an asterisk per character and never the secret', async () => {
    const io = harness({ isTTY: true });
    const answer = promptSecret('Steam password: ', io.streams);
    await tick();
    io.send('hunter2\r');

    expect(await answer).toBe('hunter2');
    const written = io.written();
    expect(written).toContain('Steam password: ');
    expect(written).toContain('*******');
    expect(written).not.toContain('hunter2');
  });

  it('restores the previous raw mode when it finishes', async () => {
    const io = harness({ isTTY: true });
    const answer = promptSecret('secret: ', io.streams);
    await tick();
    io.send('a\r');

    await answer;
    expect(io.rawModeCalls).toEqual([true, false]);
  });

  it('handles backspace', async () => {
    const io = harness({ isTTY: true });
    const answer = promptSecret('secret: ', io.streams);
    await tick();
    io.send('abcx\u007fd\r');
    expect(await answer).toBe('abcd');
  });

  it('ignores backspace on an empty value', async () => {
    const io = harness({ isTTY: true });
    const answer = promptSecret('secret: ', io.streams);
    await tick();
    io.send('\u007f\u007fab\r');
    expect(await answer).toBe('ab');
  });

  it('treats the Windows backspace byte the same way', async () => {
    const io = harness({ isTTY: true });
    const answer = promptSecret('secret: ', io.streams);
    await tick();
    io.send('abc\bd\r');
    expect(await answer).toBe('abd');
  });

  it('clears the line on ctrl+u', async () => {
    const io = harness({ isTTY: true });
    const answer = promptSecret('secret: ', io.streams);
    await tick();
    io.send('wrong\u0015right\r');
    expect(await answer).toBe('right');
  });

  it('drops arrow keys instead of inserting their escape sequence', async () => {
    const io = harness({ isTTY: true });
    const answer = promptSecret('secret: ', io.streams);
    await tick();
    io.send('ab\u001b[A\u001b[Dcd\r');
    expect(await answer).toBe('abcd');
  });

  it('accepts a value pasted as one chunk', async () => {
    const io = harness({ isTTY: true });
    const answer = promptSecret('secret: ', io.streams);
    await tick();
    io.send('a-long-pasted-token\r');
    expect(await answer).toBe('a-long-pasted-token');
  });

  it('reassembles a multi-byte character split across chunks', async () => {
    const io = harness({ isTTY: true });
    const answer = promptSecret('secret: ', io.streams);
    await tick();

    // "ż" is two bytes; deliver them in separate reads.
    const bytes = Buffer.from('ż', 'utf8');
    (io.streams.input as PassThrough).write(bytes.subarray(0, 1));
    await tick();
    (io.streams.input as PassThrough).write(bytes.subarray(1));
    await tick();
    io.send('\r');

    expect(await answer).toBe('ż');
  });

  it('accepts a newline as the line terminator too', async () => {
    const io = harness({ isTTY: true });
    const answer = promptSecret('secret: ', io.streams);
    await tick();
    io.send('abc\n');
    expect(await answer).toBe('abc');
  });

  it('rejects on ctrl+c', async () => {
    const io = harness({ isTTY: true });
    const answer = promptSecret('secret: ', io.streams);
    await tick();
    io.send('abc\u0003');
    await expect(answer).rejects.toBeInstanceOf(PromptCancelled);
  });

  it('submits a non-empty value on ctrl+d and cancels an empty one', async () => {
    const withValue = harness({ isTTY: true });
    const submitted = promptSecret('secret: ', withValue.streams);
    await tick();
    withValue.send('abc\u0004');
    expect(await submitted).toBe('abc');

    const empty = harness({ isTTY: true });
    const cancelled = promptSecret('secret: ', empty.streams);
    await tick();
    empty.send('\u0004');
    await expect(cancelled).rejects.toBeInstanceOf(PromptCancelled);
  });
});

describe('promptSecret without a terminal', () => {
  it('falls back to a plain line read, since piped input is not echoed', async () => {
    const io = harness({ isTTY: false });
    const answer = promptSecret('Steam password: ', io.streams);
    await tick();
    io.send('hunter2\n');

    expect(await answer).toBe('hunter2');
    expect(io.rawModeCalls).toEqual([]);
  });
});

describe('confirm', () => {
  it('accepts y and yes, and treats anything else as no', async () => {
    for (const [reply, expected] of [
      ['y', true],
      ['yes', true],
      ['Y', true],
      ['n', false],
      ['', false],
      ['maybe', false],
    ] as [string, boolean][]) {
      const io = harness({ isTTY: false });
      const answer = confirm('Replace it?', io.streams);
      await tick();
      io.send(`${reply}\n`);
      expect(await answer, `reply ${JSON.stringify(reply)}`).toBe(expected);
    }
  });
});

describe('consecutive prompts on one stream', () => {
  it('leaves stdin readable for the prompt that follows a secret', async () => {
    const io = harness({ isTTY: true });

    const secret = promptSecret('Steam password: ', io.streams);
    await tick();
    io.send('hunter2\r');
    expect(await secret).toBe('hunter2');

    // The secret prompt hands the stream back paused; readline must still be
    // able to read from it. Verified against a pty as well as this harness.
    const code = prompt('Steam Guard code: ', io.streams);
    await tick();
    io.send('12345\n');
    expect(await code).toBe('12345');
  });

  it('supports two secrets in a row', async () => {
    const io = harness({ isTTY: true });

    const first = promptSecret('password: ', io.streams);
    await tick();
    io.send('one\r');
    expect(await first).toBe('one');

    const second = promptSecret('passphrase: ', io.streams);
    await tick();
    io.send('two\r');
    expect(await second).toBe('two');
  });
});

describe('prompt cancellation via signal', () => {
  it('takes the prompt down when the signal aborts', async () => {
    const io = harness({ isTTY: false });
    const controller = new AbortController();
    const answer = prompt('Steam Guard code: ', io.streams, controller.signal);
    await tick();

    controller.abort();
    await expect(answer).rejects.toBeInstanceOf(PromptCancelled);
  });

  it('rejects immediately when the signal is already aborted', async () => {
    const io = harness({ isTTY: false });
    const controller = new AbortController();
    controller.abort();
    await expect(prompt('code: ', io.streams, controller.signal)).rejects.toBeInstanceOf(
      PromptCancelled,
    );
  });

  it('still resolves normally when the signal never fires', async () => {
    const io = harness({ isTTY: false });
    const controller = new AbortController();
    const answer = prompt('code: ', io.streams, controller.signal);
    await tick();
    io.send('98765\n');
    expect(await answer).toBe('98765');
  });
});
