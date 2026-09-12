/**
 * A log pane that counts repeats instead of printing them.
 *
 * Reading one 1000-item storage unit emits two trace lines per item, and a
 * sync across every unit would be tens of thousands of identical lines --
 * enough to make the page unusable exactly while it is doing the thing you
 * asked for. Collapsing keeps the trace affordable at that scale, which
 * matters because the trace is the only reason the game coordinator's silence
 * was ever diagnosable.
 */
export class CollapsingLog {
  private last: { text: string; cls: string; element: HTMLElement; count: number } | null = null;

  constructor(private readonly target: HTMLElement) {}

  write(text: string, cls = ''): void {
    // Blank lines are spacing, never a repeat to count.
    if (this.last && text !== '' && this.last.text === text && this.last.cls === cls) {
      this.last.count += 1;
      this.last.element.textContent = `${text} ×${this.last.count}\n`;
      this.scrollToEnd();
      return;
    }

    const span = document.createElement('span');
    if (cls) span.className = cls;
    span.textContent = `${text}\n`;
    this.target.append(span);
    this.last = { text, cls, element: span, count: 1 };
    this.scrollToEnd();
  }

  /** Starts fresh, so a line repeated from a previous run is not counted into it. */
  clear(): void {
    this.target.textContent = '';
    this.target.className = '';
    this.last = null;
  }

  private scrollToEnd(): void {
    this.target.scrollTop = this.target.scrollHeight;
  }
}
