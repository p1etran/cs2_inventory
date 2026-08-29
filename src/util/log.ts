const START = Date.now();

let progressWidth = 0;

function stamp(): string {
  const elapsed = ((Date.now() - START) / 1000).toFixed(1).padStart(6);
  return `[${elapsed}s]`;
}

export const log = {
  info(message: string): void {
    log.endProgress();
    process.stdout.write(`${stamp()} ${message}\n`);
  },
  warn(message: string): void {
    log.endProgress();
    process.stderr.write(`${stamp()} warn: ${message}\n`);
  },
  error(message: string): void {
    log.endProgress();
    process.stderr.write(`${stamp()} error: ${message}\n`);
  },
  /** Redraws one line in place, for counters that tick many times. */
  progress(message: string): void {
    if (!process.stdout.isTTY) return;
    const line = `${stamp()} ${message}`;
    process.stdout.write(`\r${line.padEnd(progressWidth)}`);
    progressWidth = Math.max(progressWidth, line.length);
  },
  endProgress(): void {
    if (progressWidth > 0 && process.stdout.isTTY) {
      process.stdout.write('\n');
    }
    progressWidth = 0;
  },
};

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
