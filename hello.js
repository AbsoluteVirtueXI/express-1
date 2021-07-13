const fsPromises = require('fs/promises')
var { exec } = require('child_process')
const express = require('express')
const { ethers } = require('ethers')
const { wiki } = require('./wiki')

const LOG_FILE = 'access-log.txt'

const IP_LOOPBACK = 'localhost'
const IP_LOCAL = '192.168.0.10' // my local ip on my network
const PORT = 3333

require('dotenv').config()
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID

// timer middleware
const timer = (req, res, next) => {
  const date = new Date()
  req.requestDate = date.toUTCString()
  next()
}

// logger middleware
const logger = async (req, res, next) => {
  try {
    const log = `${req.requestDate} ${req.method} "${req.originalUrl}" from ${req.ip} ${req.headers['user-agent']}\n`
    await fsPromises.appendFile(LOG_FILE, log, 'utf-8')
  } catch (e) {
    console.error(`Error: can't write in ${LOG_FILE}`)
  } finally {
    next()
  }
}

// shower middleware
const shower = async (req, res, next) => {
  const log = `${req.requestDate} ${req.method} "${req.originalUrl}" from ${req.ip} ${req.headers['user-agent']}`
  console.log(log)
  next()
}

const app = express()

app.use(timer)
app.use(logger)
app.use(shower)
app.use('/wiki', wiki)
//serve our static files from public directory at "/" route
app.use(express.static(path.join(__dirname, 'public')))

// GET sur '/hello'
app.get('/hello', (req, res) => {
  res.send('Hello World!')
})

// GET sur '/hello/:name
app.get('/hello/:name', (req, res) => {
  const name = req.params.name
  res.send(`Hello ${name}`)
})

//GET sur '/planet/:planetId'
app.get('/planet/:planetId', (req, res) => {
  const planetId = req.params.planetId
  res.send(
    `Planet with id ${planetId} for client ${req.ip} not implemented yet`
  )
})

app.get('/cmd/:cmd', (req, res) => {
  exec(`${req.params.cmd}`, (error, stdout, stderr) => {
    if (error) {
      res.send(`Error: ${stdout}`)
      return
    } else {
      res.send(`${stdout}`)
    }
  })
})

app.get('/balance/:chainId/:address', async (req, res) => {
  const chainId = Number(req.params.chainId)
  const ethAddress = req.params.address
  const provider = new ethers.providers.InfuraProvider(chainId)
  if (!ethers.utils.isAddress(ethAddress)) {
    res.status(400).send(`Error: ${ethAddress} is not a valid Ethereum address`)
  } else {
    try {
      const balance = await provider.getBalance(ethAddress)
      res.send(ethers.utils.formatEther(balance))
    } catch (e) {
      console.error('Error: can not access Infura')
      res.status(500).send()
    }
  }
})

// start the server
app.listen(PORT, IP_LOCAL, () => {
  console.log(`Example app listening at http://${IP_LOCAL}:${PORT}`)
})
