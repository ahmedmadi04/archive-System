const http = require('http');

function post(url, data) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const req = http.request({
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(JSON.stringify(data))
            }
        }, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve({ body: JSON.parse(body), status: res.statusCode }));
        });
        req.on('error', reject);
        req.write(JSON.stringify(data));
        req.end();
    });
}

function get(url, token) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const req = http.request({
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve({ body: JSON.parse(body), status: res.statusCode }));
        });
        req.on('error', reject);
        req.end();
    });
}

async function runTest() {
    try {
        console.log('Testing login...');
        const login = await post('http://localhost:3000/api/auth/login', { username: 'admin', password: 'admin123' });
        console.log('Login Status:', login.status);
        console.log('Login Body:', JSON.stringify(login.body, null, 2));

        if (login.status === 200 && login.body.success) {
            const token = login.body.data.token;
            console.log('\nTesting check-auth...');
            const auth = await get('http://localhost:3000/api/auth/check-auth', token);
            console.log('Auth Status:', auth.status);
            console.log('Auth Body:', JSON.stringify(auth.body, null, 2));
        }
    } catch (e) {
        console.error('Test failed:', e);
    }
}

runTest();
