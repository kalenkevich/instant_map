import express from "express";

const app = express();
const port = parseInt(process.env['TEST_SERVER_PORT']) || 3000;

app.use(express.static('dist'));

app.listen(port, () => {
  console.log(`Test server up and runnig on port: ${port}`);
});