// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { CollapsingLog } from '../extension/src/ui/log.js';

/**
 * The log pane at the scale a real sync produces.
 *
 * A 1000-item storage unit emits two trace lines per item; twenty-two units
 * would be tens of thousands. The failure this guards against is not a wrong
 * value but an unusable page, which no other test would notice.
 */

let target: HTMLElement;
let log: CollapsingLog;

beforeEach(() => {
  document.body.innerHTML = '<pre id="log"></pre>';
  target = document.getElementById('log') as HTMLElement;
  log = new CollapsingLog(target);
});

const lines = () => [...target.children].map((child) => child.textContent?.trimEnd() ?? '');

describe('the log pane', () => {
  it('writes distinct lines as they come', () => {
    log.write('first');
    log.write('second');
    expect(lines()).toEqual(['first', 'second']);
  });

  it('counts a repeat instead of printing it again', () => {
    for (let i = 0; i < 3; i += 1) log.write('<- GC SO_Create (21)');
    expect(lines()).toEqual(['<- GC SO_Create (21) ×3']);
  });

  it('keeps a thousand repeats to a single element', () => {
    // The real case: one 1000-item storage unit arriving one object at a time.
    for (let i = 0; i < 1000; i += 1) log.write('<- GC SO_Create (21)');

    expect(target.children.length).toBe(1);
    expect(lines()).toEqual(['<- GC SO_Create (21) ×1000']);
  });

  it('starts a new run when the text changes back', () => {
    log.write('a');
    log.write('a');
    log.write('b');
    log.write('a');
    expect(lines()).toEqual(['a ×2', 'b', 'a']);
  });

  it('does not merge lines that only look alike', () => {
    // Same text, different class: one is an error, and hiding it inside a
    // count of ordinary lines would lose it.
    log.write('Read 1000 items', 'ok');
    log.write('Read 1000 items', 'bad');
    expect(lines()).toEqual(['Read 1000 items', 'Read 1000 items']);
    expect([...target.children].map((child) => child.className)).toEqual(['ok', 'bad']);
  });

  it('treats blank lines as spacing, not as repeats', () => {
    log.write('');
    log.write('');
    expect(target.children.length).toBe(2);
  });

  it('forgets the previous run when cleared', () => {
    log.write('same');
    log.clear();
    log.write('same');
    expect(lines()).toEqual(['same']);
  });

  it('keeps the newest line in view', () => {
    Object.defineProperty(target, 'scrollHeight', { value: 5000, configurable: true });
    log.write('anything');
    expect(target.scrollTop).toBe(5000);
  });
});
