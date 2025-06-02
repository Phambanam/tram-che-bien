// Very simple test
const http = require('http');

function testApiWithoutAuth() {
  // Just make a simple HTTP request to check if server is running
  http.get('http://localhost:5001', (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
    
    res.setEncoding('utf8');
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
      try {
        console.log('BODY:', rawData);
      } catch (e) {
        console.error(e.message);
      }
    });
  }).on('error', (e) => {
    console.error(`Got error: ${e.message}`);
  });
}

testApiWithoutAuth(); 