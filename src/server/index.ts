// node_modules/typescript/bin/tsc -p ./src/server/ && node src/server/index.js
import * as bodyParser from 'body-parser';
import * as compression from 'compression';
import * as cors from 'cors';
import * as express from 'express';
import * as path from 'path';

import { jwtCheck } from './jwt';
import { router as routes } from './routes/documents';
import { router as userSettings } from './routes/user.settings';
import { router as suggests } from './routes/suggest';
import { router as utils } from './routes/utils';
import { router as registers } from './routes/registers';

const root = './';
const app = express();

app.use(compression());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(path.join(root, 'dist')));

app.use('/api', jwtCheck, routes);
app.use('/api', jwtCheck, userSettings);
app.use('/api', jwtCheck, suggests);
app.use('/api', jwtCheck, utils);
app.use('/api', jwtCheck, registers);

app.get('*', (req, res) => {
  res.sendFile('dist/index.html', { root: root });
});

const port = process.env.PORT || '3000';
app.listen(port, () => console.log(`API running on localhost:${port}`));
