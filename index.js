const EventEmitter = require('events')

module.exports = class ReadyResource extends EventEmitter {
  constructor ({ suspended = false } = {}) {
    super()

    this.opening = null
    this.closing = null

    this.opened = false
    this.closed = false

    this.shouldBeSuspended = suspended
    this.suspendChanging = null
    this.suspended = suspended
  }

  ready () {
    if (this.opening !== null) return this.opening
    this.opening = open(this)
    return this.opening
  }

  close () {
    if (this.closing !== null) return this.closing
    this.closing = close(this)
    return this.closing
  }

  async suspend () {
    this.shouldBeSuspended = true
    if (!this.opened) await this.ready()

    while (this.suspendChanging) {
      if (this.closing) return
      if (!this.shouldBeSuspended) return // resume called in the meantime
      await this.suspendChanging
    }
    if (this.closing) return
    if (!this.shouldBeSuspended) return // resume called in the meantime
    if (this.suspended) return // already suspended

    this.suspendChanging = this._suspend()
    await this.suspendChanging
    this.suspended = true
    this.suspendChanging = null
    this.emit('suspend')
  }

  async resume () {
    this.shouldBeSuspended = false
    if (!this.opened) await this.ready()

    while (this.suspendChanging) {
      if (this.closing) return
      if (this.shouldBeSuspended) return // suspend called in the meantime
      await this.suspendChanging
    }
    if (this.closing) return
    if (this.shouldBeSuspended) return // suspend called in the meantime
    if (!this.suspended) return // already resumed

    this.suspendChanging = this._resume()
    await this.suspendChanging
    this.suspended = false
    this.suspendChanging = null
    this.emit('resume')
  }

  async _open () {
    // add impl here
  }

  async _close () {
    // add impl here
  }

  async _suspend () {
    // add impl here
  }

  async _resume () {
    // add impl here
  }
}

async function open (self) {
  // open after close
  if (self.closing !== null) return

  try {
    await self._open()
  } catch (err) {
    self.close() // safe to run in bg
    throw err
  }

  self.opened = true
  self.emit('ready')
}

async function close (self) {
  try {
    if (self.opened === false && self.opening !== null) await self.opening
  } catch {
    // ignore errors on closing
  }

  // Avoid edge cases due to closing while suspending/resuming
  if (self.suspendChanging) await self.suspendChanging

  if (self.opened === true || self.opening === null) await self._close()
  self.closed = true
  self.emit('close')
}
