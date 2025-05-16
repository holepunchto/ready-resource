const rrp = require('resolve-reject-promise')
const test = require('brittle')
const Resource = require('./')

test('basic', async function (t) {
  const r = new Resource()

  let opened = false
  let closed = false

  r._open = async function () {
    opened = true
  }

  r._close = async function () {
    closed = true
  }

  await r.ready()

  t.is(opened, true)
  t.is(closed, false)

  await r.close()

  t.is(opened, true)
  t.is(closed, true)
})

test('basic - close when open throws', async function (t) {
  const r = new Resource()

  let triggered = false

  r._open = async function () {
    throw new Error('Synthetic')
  }

  r._close = async function () {
    triggered = true
  }

  await t.exception(r.ready(), /Synthetic/)

  t.is(r.opened, false)
  t.is(triggered, false)
  t.is(r.closed, true) // autocloses

  await t.execution(r.close())

  t.is(r.opened, false)
  t.is(triggered, false)
  t.is(r.closed, true)
})

test('ready rejecting emits close', async t => {
  t.plan(4)

  const r = new Resource()
  r._open = () => Promise.reject(new Error('bad open'))

  r.on('close', () => {
    t.pass('emitted close')
    t.ok(r.closed)
    t.ok(r.closing)
  })

  await t.exception(r.ready())
})

test('basic suspend and resume', async function (t) {
  const r = new Resource()

  let nrSuspends = 0
  let nrResumes = 0
  r._suspend = async function () {
    nrSuspends++
  }

  r._resume = async function () {
    nrResumes++
  }

  t.is(r.suspended, false, 'init not suspended by default')
  t.is(r.opened, false, 'sanity check')

  await r.suspend()
  t.is(r.suspended, true, 'suspended now')
  t.is(nrSuspends, 1, '_suspend ran')
  t.is(r.opened, true, 'suspending before ready ensures ready runs')

  await r.suspend()
  t.is(nrSuspends, 1, 'suspending while suspended does not call _suspend')
  t.is(r.suspended, true, 'suspended still')

  await r.resume()
  t.is(nrResumes, 1, '_resume ran')
  t.is(r.suspended, false, 'resumed now')

  await r.resume()
  t.is(nrResumes, 1, 'resuming while resumed does not call _resume again')
  t.is(r.suspended, false, 'resumed still')

  await r.suspend()
  t.is(nrSuspends, 2, 'suspend runs again if resumed before')
  t.is(r.suspended, true, 'suspended')
})

test('can init with suspended: true', async function (t) {
  const r = new Resource({ suspended: true })

  let nrSuspends = 0
  let nrResumes = 0
  r._suspend = async function () {
    nrSuspends++
  }

  r._resume = async function () {
    nrResumes++
  }

  t.is(r.suspended, true, 'suspended by default')

  await r.resume()
  t.is(nrResumes, 1, '_resume ran')
  t.is(r.suspended, false, 'resumed now')
  t.is(nrSuspends, 0, 'sanity check (suspend never ran')
})

test('suspend and resume race conditions', async function (t) {
  const r = new Resource()

  let nrSuspends = 0
  let nrResumes = 0

  r._suspend = async function () {
    nrSuspends++
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  r._resume = async function () {
    nrResumes++
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  await r.ready()
  t.is(r.suspended, false, 'init not suspended (sanity check)')

  {
    const susProm = r.suspend()
    const resProm = r.resume()
    await Promise.all([susProm, resProm])
    t.is(r.suspended, false, 'last action (resume) wins')
  }

  t.is(r.suspended, false, 'not suspended (sanity check)')
  {
    const susProm = r.suspend()
    const resProm = r.resume()
    const reSusProm = r.suspend()
    await Promise.all([susProm, resProm, reSusProm])
    t.is(r.suspended, true, 'last action (suspend) wins')
  }

  t.is(r.suspended, true, 'suspended (sanity check)')
  const initSuspends = nrSuspends
  const initResumes = nrResumes
  {
    const susProm = r.resume()
    const laterProms = []
    // DEVNOTE: These promises can never reject, so no need for catch handlers
    {
      const { resolve, promise } = rrp()
      laterProms.push(promise)
      setTimeout(async () => {
        await r.suspend()
        resolve()
      }, 100)
    }
    {
      const { resolve, promise } = rrp()
      laterProms.push(promise)
      setTimeout(async () => {
        await r.resume()
        resolve()
      }, 150)
    }
    {
      const { resolve, promise } = rrp()
      laterProms.push(promise)
      setTimeout(async () => {
        await r.suspend()
        resolve()
      }, 200)
    }

    await susProm
    t.is(r.suspended, false, 'resume ran to completion')
    t.is(r.shouldBeSuspended, true, 'desired state shows it should be suspended')

    await Promise.all(laterProms)
    t.is(r.suspended, true, 'ended up suspended')
    t.is(r.shouldBeSuspended, true, 'desired state shows it should be suspended')
    t.is(nrSuspends - initSuspends, 1, 'only ran _suspend once')
    t.is(nrResumes - initResumes, 1, 'only ran _resume once')
  }
})
