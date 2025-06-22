import { EventEmitter } from 'events';

declare class ReadyResource extends EventEmitter {
  private opening: Promise<void> | null;
  private closing: Promise<void> | null;
  private opened: boolean;
  private closed: boolean;

  constructor();

  ready(): Promise<void>;
  close(): Promise<void>;

  protected _open(): Promise<void>;
  protected _close(): Promise<void>;
}

export = ReadyResource; 