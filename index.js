const EventEmitter = require('events')
const mutexify = require('mutexify/promise')

module.exports = class ReadyResource extends EventEmitter {
  constructor ({ suspended = false } = {}) {
    super()

    this.opening = null
    this.closing = null

    this.opened = false
    this.closed = false

    this.shouldBeSuspended = suspended
    this.suspended = suspended
    this._suspendMutex = mutexify()
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

    if (this.suspended) return // already in desired state
    const release = await this._suspendMutex()
    try {
      if (this.suspended) return // already done
      if (!this.shouldBeSuspended) return // desired state is now to resume
      this.suspended = true
      await this._suspend()
      this.emit('suspend')
    } finally {
      release()
    }
  }

  async resume () {
    this.shouldBeSuspended = false
    if (!this.opened) await this.ready()

    if (!this.suspended) return // already in desired state

    const release = await this._suspendMutex()
    try {
      if (!this.suspended) return // already done
      if (this.shouldBeSuspended) return // desired state is now to suspend
      this.suspended = false
      await this._resume()
      this.emit('resume')
    } finally {
      release()
    }
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
  if (self.opened === true || self.opening === null) await self._close()
  self.closed = true
  self.emit('close')
}
