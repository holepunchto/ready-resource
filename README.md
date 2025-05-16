# ready-resource

Modern single resource management. Includes open/close and resume/suspend functionality.

```
npm install ready-resource
```

## Usage

``` js
const ReadyResource = require('ready-resource')

class Thing extends ReadyResource {
  constructor () {
    super()
  }

  async _open () {
    // open the resource
  }

  async _close () {
    // close the resource
  }
}

const r = new Thing()

await r.ready() // calls _open once
await r.ready() // noop

await r.close() // calls _close after _open has finished
await r.close() // noop
```

## Suspend/Resume Usage

``` js
const ReadyResource = require('ready-resource')

class Thing extends ReadyResource {
  constructor () {
    super()
  }

  async _open () {
    // open the resource
  }

  async _close () {
    // close the resource
  }

  async _suspend() {
    // suspend the resource (only implement if suspend/resume is required)
  }

  async _resume_() {
    // resume the resource (only implement if suspend/resume is required)
  }
}

const r = new Thing()

await r.ready() // calls _open once
await r.ready() // noop

await r.suspend() // calls _suspend once
await r.suspend() // noop

await r.resume() // calls _resume once
await r.resume() // noop

await Promise.all([r.suspend(), r.resume()]) // ends up resumed, since resume is the last method to be called 

await r.close()
```


## License

MIT
