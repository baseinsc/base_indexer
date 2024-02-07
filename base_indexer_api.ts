global.test = false 

import * as Koa from "koa";
import * as Router from "koa-router";
import * as bodyParser  from "koa-bodyparser";
import * as cors from "koa2-cors";
import { handleRouters } from "./src/routers";
const fs = require("fs");
// const enforceHttps = require('koa-sslify');
const path = require("path");
const http = require("http");
const https = require("https");

const app = new Koa();
const router = new Router();

app.use(bodyParser())
handleRouters(router)

app.use(
  cors({
    origin: function (ctx) {
      return "*";
    },
    maxAge: 5,
    credentials: true,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "Accept"],
    exposeHeaders: ["WWW-Authenticate", "Server-Authorization"],
  })
);
app.use(router.routes());
app.use(router.allowedMethods());

// // start the server
http.createServer(app.callback()).listen(4000);

// const options = {
//     key: fs.readFileSync("ssl/ssl.key"),
//     cert: fs.readFileSync("ssl/ssl.pem"),
// };
// Force HTTPS on all page
// app.use(enforceHttps());
// https.createServer(options, app.callback()).listen(443);
