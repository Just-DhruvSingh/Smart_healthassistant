import express from 'express'
import cors from 'cors'
import patientRoutes from './routes/patientRoutes.js'
import voiceRoutes from './routes/voiceRoutes.js'

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`)
  next()
})

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SwasthyaLink API is running.',
  })
})

app.use('/', patientRoutes)
app.use('/api', voiceRoutes)

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found.',
  })
})

app.use((error, req, res, next) => {
  console.error('Server error:', error)

  res.status(500).json({
    success: false,
    message: 'Internal server error.',
    error: error.message,
  })
})

app.listen(PORT, () => {
  console.log(`SwasthyaLink backend running on http://localhost:${PORT}`)
})
