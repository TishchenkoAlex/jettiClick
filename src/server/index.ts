import * as bodyParser from 'body-parser';
import * as compression from 'compression';
import * as cors from 'cors';
import * as express from 'express';
import * as path from 'path';

import { jwtCheck } from './jwt';
import { router } from './routes';

const root = './';
const app = express();

app.use(compression());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(root, 'dist')));
app.use('/api', jwtCheck, router);
app.get('*', (req, res) => {
  res.sendFile('dist/index.html', { root: root });
});

const port = process.env.PORT || '3000';
app.listen(port, () => console.log(`API running on localhost:${port}`));
