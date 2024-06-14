const EventEmitter = require('events')

module.exports = class ReadyResource extends EventEmitter {
  constructor () {
    super()

    this.opening = null
    this.closing = null

    this.opened = false
    this.closed = false
  }

  ready () {
    if (this.opening) return this.opening
    this.opening = open(this)
    return this.opening
  }

  close () {
    if (this.closing) return this.closing
    this.closing = close(this)
    return this.closing
  }

  async _open () {
    // add impl here
  }

  async _close () {
    // add impl here
  }
}

async function open (self) {
  try {
    await self._open()
  } catch (err) {
    self.closing = close(self) // safe to run in bg
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
  if (self.opened) await self._close()
  self.closed = true
  self.emit('close')
}
