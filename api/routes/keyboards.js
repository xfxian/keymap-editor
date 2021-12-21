const { Router } = require('express')
const zmk = require('../services/zmk')

const router = Router()

router.get('/behaviors', (req, res) => res.json(zmk.loadBehaviors()))
router.get('/keycodes', (req, res) => res.json(zmk.loadKeycodes()))
router.get('/layout', (req, res) => res.json(zmk.loadLayout()))
router.get('/keymap', (req, res) => res.json(zmk.loadKeymap()))
router.post('/keymap', (req, res) => {
  const keymap = req.body
  const layout = zmk.loadLayout()
  const generatedKeymap = zmk.generateKeymap(layout, keymap)
  const exportStdout = zmk.exportKeymap(generatedKeymap, 'flash' in req.query, err => {
    if (err) {
      res.status(500).send(err)
      return
    }

    res.send()
  })

  // exportStdout.stdout.on('data', data => {
  //   for (let sub of subscribers) {
  //     sub.send(data)
  //   }
  // })
})

// this just allows me to match what the pw site has, since the vue part is basically the same as
// what's going to be on the site
router.post('/api/editor/build', (req, res) => res.redirect(307, '/api/editor/keymap'))
router.post("/api/editor/keymap", (req, res) => {
  if (req.method === 'POST') {
    const keymap = req.body
    const layout = zmk.loadLayout()
    const generatedKeymap = zmk.generateKeymap(layout, keymap)

    return res.status(200).json(generatedKeymap.json)
  }
})

module.exports = router
