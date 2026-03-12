declare module 'ready-resource' {
  import { EventEmitter, EventMap } from 'events'

  /**
   * Default events that come with ReadyResource
   * Adds type hints for `.on`/`once`/`.emit`
   * Passed in EventMaps will get these added
   */
  interface ReadyResourceEvents {
    ready: [],
    close: []
  }

  /**
   * Runtime export is CommonJS:
   *   module.exports = class ReadyResource extends EventEmitter {}
   * This declaration mirrors that shape.
   */
  class ReadyResource<T extends EventMap<T> = ReadyResourceEvents> extends EventEmitter<T & ReadyResourceEvents> {
    constructor() // eslint-disable-line constructor-super

    /** Set when a call to ready() has started; resolves when _open completes */
    opening: Promise<void> | null

    /** Set when a call to close() has started; resolves when _close completes */
    closing: Promise<void> | null

    /** True after successful _open */
    opened: boolean

    /** True after successful _close (or attempted close after failed open) */
    closed: boolean

    /** Ensure the resource is opened; returns the in-flight promise if any */
    ready(): Promise<void>

    /** Ensure the resource is closed; returns the in-flight promise if any */
    close(): Promise<void>

    /** Override these in subclasses */
    protected _open(): Promise<void>
    protected _close(): Promise<void>
  }

  // Match CommonJS runtime export
  export = ReadyResource
}
