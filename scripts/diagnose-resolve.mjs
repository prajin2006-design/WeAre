import http from 'http';

http.get('http://localhost:3000/api/catalog/item?id=1396', (res) => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => console.log('1396 RESULT:', body));
});
