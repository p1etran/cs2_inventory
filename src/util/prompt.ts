import readline from 'node:readline';

function ask(question: string, mute: boolean): Promise<string> {
  return new Promise((resolve) => {
    // The prompt is written directly so that muting the interface's echo does
    // not also hide the question itself.
    process.stdout.write(question);

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    if (mute) {
      (rl as unknown as { _writeToOutput: (text: string) => void })._writeToOutput = () => {};
    }

    rl.question('', (answer) => {
      rl.close();
      if (mute) process.stdout.write('\n');
      resolve(answer);
    });
  });
}

export async function prompt(question: string): Promise<string> {
  return (await ask(question, false)).trim();
}

/** Reads a line without echoing it, for passwords and passphrases. */
export async function promptSecret(question: string): Promise<string> {
  return ask(question, true);
}

export async function confirm(question: string): Promise<boolean> {
  const answer = (await prompt(`${question} [y/N] `)).toLowerCase();
  return answer === 'y' || answer === 'yes';
}
