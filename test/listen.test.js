'use strict'

const os = require('os')
const path = require('path')
const fs = require('fs')
const test = require('tap').test
const Fastify = require('..')

test('listen accepts a port and a callback', t => {
  t.plan(2)
  const fastify = Fastify()
  fastify.listen(0, (err) => {
    fastify.server.unref()
    t.error(err)
    t.pass()
    fastify.close()
  })
})

test('listen accepts a port, address, and callback', t => {
  t.plan(2)
  const fastify = Fastify()
  fastify.listen(0, '127.0.0.1', (err) => {
    fastify.server.unref()
    t.error(err)
    t.pass()
    fastify.close()
  })
})

test('listen after Promise.resolve()', t => {
  t.plan(2)
  const f = Fastify()
  Promise.resolve()
    .then(() => {
      f.listen(0, (err) => {
        f.server.unref()
        t.error(err)
        t.pass()
        f.close()
      })
    })
})

test('register after listen using Promise.resolve()', t => {
  t.plan(1)
  const f = Fastify()

  const handler = (req, res) => res.send({})
  Promise.resolve()
    .then(() => {
      f.get('/', handler)
      f.register((f2, options, done) => {
        f2.get('/plugin', handler)
        done()
      })
    })
    .catch((e) => {
      t.ok(e)
    })
})

test('double listen errors', t => {
  t.plan(2)
  const fastify = Fastify()
  fastify.listen(0, (err) => {
    t.error(err)
    fastify.listen(fastify.server.address().port, (err) => {
      t.ok(err)
      fastify.close()
    })
  })
})

test('listen twice on the same port', t => {
  t.plan(2)
  const fastify = Fastify()
  fastify.listen(0, (err) => {
    t.error(err)
    const s2 = Fastify()
    s2.listen(fastify.server.address().port, (err) => {
      fastify.close()
      t.ok(err)
    })
  })
})

// https://nodejs.org/api/net.html#net_ipc_support
if (os.platform() !== 'win32') {
  test('listen on socket', t => {
    t.plan(2)
    const fastify = Fastify()
    const sockFile = path.join(os.tmpdir(), 'server.sock')
    try {
      fs.unlinkSync(sockFile)
    } catch (e) { }
    fastify.listen(sockFile, (err) => {
      t.error(err)
      t.equal(sockFile, fastify.server.address())
      fastify.close()
    })
  })
}

test('listen without callback', t => {
  const fastify = Fastify()
  fastify.listen(0)
  fastify.server.on('listening', function () { this.close() })
  t.end()
})
