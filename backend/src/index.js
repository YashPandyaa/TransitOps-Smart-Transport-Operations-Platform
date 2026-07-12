import { app } from './app.js'
import { getEnv } from './config/env.js'

const env = getEnv()

app.listen(env.port, () => {
  console.log(`TransitOps backend listening on http://localhost:${env.port}`)
})

