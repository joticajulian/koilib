const fastify = require("fastify")({ logger: true });
const path = require("path");
const axios = require("axios");

fastify.register(require("fastify-static"), {
  root: path.join(__dirname, ".."),
});
fastify.get("/", function (req, reply) {
  return reply.sendFile("tests/test.html");
});
fastify.get("/koinos.js", function (req, reply) {
  return reply.sendFile("dist/koinos.js");
});

// proxy jsonrpc to avoid cors issues
const apiKoinos = "http://api.koinos.io:8080";
fastify.post("/jsonrpc", async (req) => {
  const response = await axios.post(apiKoinos, req.body);
  return response.data;
});

const start = async () => {
  try {
    await fastify.listen(8080);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
