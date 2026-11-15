import http from 'node:http';
import handler from '../../api/index.js';

http.createServer(handler).listen(process.env.PORT, () => console.log(`Vercel handler on ${process.env.PORT}`));
