const fastify = require("fastify")({ logger: true });
const path = require("path");
const axios = require("axios");
require("dotenv").config();

fastify.register(require("fastify-static"), {
  root: path.join(__dirname, "../docs"),
});

// proxy jsonrpc to avoid cors issues
const apiKoinos = process.env.RPC_NODES.split(",")[0];
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
