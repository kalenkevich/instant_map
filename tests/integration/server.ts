import path from 'path';
import express from 'express';

const app = express();
const port = parseInt(process.env['TEST_SERVER_PORT']) || 3000;

app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  const nativeResponseEnd = res.end;
  // @ts-ignore
  res.end = function () {
    nativeResponseEnd.apply(res, arguments);

    console.log(`[${new Date().toISOString()}]: ${req.originalUrl} ${res.statusCode}`);
  };

  next();
});

app.use(express.static('dist'));
app.use('/osm', express.static(path.join(__dirname, './__mocks__/osm'), { dotfiles: 'allow' }));
app.use('/maptiler', express.static(path.join(__dirname, './__mocks__/maptiler'), { dotfiles: 'allow' }));

app.listen(port, () => {
  console.log(`Test server up and runnig on port: ${port}`);
});
