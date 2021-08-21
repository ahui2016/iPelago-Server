// https://github.com/zenorocha/clipboard.js/blob/master/src/clipboard.d.ts
type Action = 'cut' | 'copy';
type Response = 'success' | 'error';
type CopyActionOptions = {
  container?: Element;
};

declare class ClipboardJS {
  constructor(
    selector: string | Element | NodeListOf<Element>,
    options?: ClipboardJS.Options
  );

  /**
   * Subscribes to events that indicate the result of a copy/cut operation.
   * @param type Event type ('success' or 'error').
   * @param handler Callback function.
   */
  on(type: Response, handler: (e: ClipboardJS.Event) => void): this;

  on(type: string, handler: (...args: any[]) => void): this;

  static copy(target: string | Element, options: CopyActionOptions): string;

  static cut(target: string | Element): string;
}

declare namespace ClipboardJS {
  interface Options {
    action?(elem: Element): Action;
    target?(elem: Element): Element;
    text?(elem: Element): string;
    container?: Element;
  }

  interface Event {
    action: string;
    text: string;
    trigger: Element;
    clearSelection(): void;
  }
}
