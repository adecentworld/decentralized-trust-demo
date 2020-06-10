const Koa = require("koa");
const static = require("koa-static");
const open = require("open");

const app = new Koa();

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "localhost";

app.use(static('dist'))
app.listen(PORT);

const url = `http://${HOST}:${PORT}`;

console.log(`Trust demo started on port ${PORT}`);
console.log(`Opening ${url} in your browser now...`);
open(url);