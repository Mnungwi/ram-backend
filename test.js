require("dotenv").config();
require("./src/models/index"); // load all associations
const { Product } = require("./src/models/index");

(async () => {
  const products = await Product.findAll({ limit: 2 });
  console.log("Via index - Count:", products.length);
  process.exit(0);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
