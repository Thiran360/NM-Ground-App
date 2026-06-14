const https = require('https');

const payload = {
  type: "timeslot",
  id: 30, // example mapped id
  action: "hold",
  date: "2026-06-30",
  groundId: 1
};

const req = https.request('https://refined-alone-causing.ngrok-free.dev/booking/admin/toggle-hold/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', data.substring(0, 1500)); // Print HTML traceback if 500
  });
});

req.on('error', e => console.error(e));
req.write(JSON.stringify(payload));
req.end();
