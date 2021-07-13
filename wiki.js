const express = require('express')
const wiki = express.Router()
wiki.get('/', (req, res) => {
  res.send('Welcome to the wiki')
})
wiki.get('/about', (req, res) => {
  res.send('about wiki page')
})
module.exports = { wiki }
