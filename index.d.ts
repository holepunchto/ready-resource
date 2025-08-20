declare module 'ready-resource' {
  import { EventEmitter } from 'events';

  /**
   * Runtime export is CommonJS:
   *   module.exports = class ReadyResource extends EventEmitter {}
   * This declaration mirrors that shape.
   */
  class ReadyResource extends EventEmitter {
    constructor();

    /** Set when a call to ready() has started; resolves when _open completes */
    opening: Promise<void> | null;

    /** Set when a call to close() has started; resolves when _close completes */
    closing: Promise<void> | null;

    /** True after successful _open */
    opened: boolean;

    /** True after successful _close (or attempted close after failed open) */
    closed: boolean;

    /** Ensure the resource is opened; returns the in-flight promise if any */
    ready(): Promise<void>;

    /** Ensure the resource is closed; returns the in-flight promise if any */
    close(): Promise<void>;

    /** Override these in subclasses */
    protected _open(): Promise<void>;
    protected _close(): Promise<void>;

    // Typed events emitted by the implementation
    on(event: 'ready', listener: () => void): this;
    on(event: 'close', listener: () => void): this;
    once(event: 'ready', listener: () => void): this;
    once(event: 'close', listener: () => void): this;
    off(event: 'ready', listener: () => void): this;
    off(event: 'close', listener: () => void): this;
    emit(event: 'ready'): boolean;
    emit(event: 'close'): boolean;

    // Fallback EventEmitter overloads
    on(event: string | symbol, listener: (...args: any[]) => void): this;
    once(event: string | symbol, listener: (...args: any[]) => void): this;
    off(event: string | symbol, listener: (...args: any[]) => void): this;
    emit(event: string | symbol, ...args: any[]): boolean;
  }

  // Match CommonJS runtime export
  export = ReadyResource;
}
