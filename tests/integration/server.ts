import path from 'path';
import express from "express";

const app = express();
const port = parseInt(process.env['TEST_SERVER_PORT']) || 3000;

app.use(express.static('dist'));
app.use('/osm', express.static(path.join(__dirname, './__mocks__/osm'), {dotfiles: 'allow'}));
app.use('/maptiler', express.static(path.join(__dirname, './__mocks__/maptiler'), {dotfiles: 'allow'}));

app.listen(port, () => {
  console.log(`Test server up and runnig on port: ${port}`);
});