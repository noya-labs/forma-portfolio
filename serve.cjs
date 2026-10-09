const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml', '.glb':'model/gltf-binary' };
http.createServer((req, res) => {
  const name = req.url.split('?')[0];
  const files = { '/': 'index.html', '/index.html': 'index.html', '/style.css': 'style.css', '/app.js': 'app.js', '/covers.js': 'covers.js', '/noya-cover.png':'noya-cover.png', '/bluebay-cover.png':'bluebay-cover.png', '/nexora-cover.png':'nexora-cover.png', '/wcr-cover.png':'wcr-cover.png' };
  if (name === '/monopoly/') files[name]='monopoly/index.html';
  else if (/^\/monopoly\/(?:index\.html|board-data\.js|board\.js|styles\.css|pic\/[a-zA-Z0-9_-]+\.(?:png|svg))$/.test(name)) files[name]=name.slice(1);
  if (name === '/monopoly-cover.jpg') files[name]='monopoly-cover.jpg';
  if (/^\/media\/[a-zA-Z0-9_-]+\.(?:png|jpg|svg)$/.test(name)) files[name]=name.slice(1);
  if (/^\/(?:projects\.js|project-page\.js|noya\.html|bluebay\.html|nexora\.html|web-control-room\.html|nahariya-1990\.html|ariel\.html)$/.test(name)) files[name]=name.slice(1);
  if (/^\/media\/(?:noya_hero\.glb|three\/(?:three\.module\.js|three\.core\.js|GLTFLoader\.js|BufferGeometryUtils\.js|RoomEnvironment\.js))$/.test(name)) files[name]=name.slice(1);
  if(name==='/noya-tours.js') files[name]='noya-tours.js';
  if(name==='/noya-cinema.js') files[name]='noya-cinema.js';
  if (!files[name]) { res.writeHead(404); res.end('Not found'); return; }
  fs.readFile(path.join(__dirname, files[name]), (error, data) => {
    if (error) { res.writeHead(500); res.end('Unable to read file'); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(files[name])] }); res.end(data);
  });
}).listen(4317, '127.0.0.1', () => console.log('FORMA local preview: http://127.0.0.1:4317'));



