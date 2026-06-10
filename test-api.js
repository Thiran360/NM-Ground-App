const https = require('https');

const req = https.request('https://api.codingboss.in/booking/login/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', data);
  });
});

req.on('error', e => console.error(e));
req.write(JSON.stringify({ email: 'test@test.com', password: 'test' }));
req.end();
