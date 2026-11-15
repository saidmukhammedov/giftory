// Runs the Vercel function (api/index.js) on a plain Node server, the way Vercel calls it
// with NODEJS_HELPERS=0, so the whole test suite can run against it: VERCEL=1 npm test
import http from 'node:http';
import handler from '../../api/index.js';

http.createServer(handler).listen(process.env.PORT, () => console.log(`Vercel handler on ${process.env.PORT}`));
