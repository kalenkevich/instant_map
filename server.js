const path = require('path');
const express = require('express');

const app = express();
const port = process.env.PORT || 8080;

app.use('/', express.static(`${__dirname}/dist`, {
  setHeaders: (res) => {
    res.set('Cross-Origin-Opener-Policy', 'same-origin');
    res.set('Cross-Origin-Embedder-Policy', 'require-corp');
  }
}));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist/index.html')));

app.listen(port, () => {
  console.log('Static server up and running on port:', port);
});