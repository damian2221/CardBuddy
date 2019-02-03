const express = require('express');
const bodyParser = require('body-parser');

const app = express();

const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

let WS;

wss.on('connection', function connection(ws) {
  WS = ws;
  /*
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });

  ws.send('something');*/
});

app.use(bodyParser.urlencoded({ extended: false }));

app.get('/card-details', function (req, res) {
  const body = req.query;
  console.log(body);
  const cardData = {
    number: body.number,
    exp_month: body.exp_month,
    exp_year: body.exp_year,
    cvv: body.cvv
  };

  if (WS) {
    WS.send(JSON.stringify(cardData));
  }

  res.set('Content-Type', 'text/plain');
  res.send(`Express Server`)
});

app.listen(3000, function (err) {
  if (err) {
    throw err
  }

  console.log('Server started on port 3000')
});