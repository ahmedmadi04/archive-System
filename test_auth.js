const http = require('http');

const data = JSON.stringify({ username: 'admin', password: 'admin123' });

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('LOGIN body:', body);
    const result = JSON.parse(body);
    if (!result.data || !result.data.token) return console.error('No token in response');
    const token = result.data.token;
    
    const opts2 = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/check-auth',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    };
    
    const req2 = http.request(opts2, (res2) => {
      console.log('CHECK status:', res2.statusCode);
      let body2 = '';
      res2.on('data', chunk => body2 += chunk);
      res2.on('end', () => console.log('CHECK body:', body2));
    });
    req2.on('error', console.error);
    req2.end();
  });
});

req.on('error', console.error);
req.write(data);
req.end();
