import Koa from "koa"
import bodyParser from "koa-bodyparser"
import { registerGeneratedRoutes } from "./routes.generated.js"

const app = new Koa()
app.use(bodyParser())
registerGeneratedRoutes(app)

const port = Number(process.env.PORT ?? 3001)
app.listen(port, () => console.log(`loomstack API listening on http://localhost:${port}`))
