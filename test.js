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
