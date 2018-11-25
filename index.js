'use strict';

// Imports dependencies and set up http server
const
  express = require('express'),
  fetch = require('node-fetch'),
  bodyParser = require('body-parser'),
  app = express().use(bodyParser.json()); // creates express http server
  
  var MongoClient = require('mongodb').MongoClient;
  var url = "mongodb://vinicioMongo:123mongo@cluster0-shard-00-00-lsstx.mongodb.net:27017,cluster0-shard-00-01-lsstx.mongodb.net:27017,cluster0-shard-00-02-lsstx.mongodb.net:27017/BancarioBot?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true";
  //var CLIENT_TOKEN = '4TMZFCK5FZUGFDFIRXRJNVY4Y4SEMRDZ'; // TCC-BANCARIO
  var CLIENT_TOKEN = 'CFPCUH3V443ESVXTNEGTZSPHHRXNHEBX'; // BANCARIO
  
// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

// Creates the endpoint for our webhook 
app.post('/webhook', (req, res) => {  
 
    let body = req.body;
  
    // Checks this is an event from a page subscription
    if (body.object === 'page') {
  
      // Iterates over each entry - there may be multiple if batched
      body.entry.forEach(function(entry) {
  
        // Gets the message. entry.messaging is an array, but 
        // will only ever contain one message, so we get index 0
        let webhook_event = entry.messaging[0];
        console.log("webhook_event");

        let sender_psid = webhook_event.sender.id;
        console.log('Sender PSID: ' + sender_psid);

        console.log(webhook_event);
        console.log("webhook_event.message");
        console.log(webhook_event.message);
      

        const q = encodeURIComponent(webhook_event.message.text);
        const uri = 'https://api.wit.ai/message?q=' + q;
        const auth = 'Bearer ' + CLIENT_TOKEN;
        fetch(uri, {headers: {Authorization: auth}})
        .then(res => res.json())
        .then(res => {
          
              console.dir(res);

              console.log(res._text);
              console.log(res.entities);

              MongoClient.connect(url, function(err, db) {
                if (err) throw err;
                var dbo = db.db("BancarioBot");

                var myobj = { 
                  sender_psid: sender_psid,
                  webhook_event: webhook_event, 
                  respostaWIT: res
                };

                dbo.collection("Message").insertOne(myobj, function(err, res) {
                  if (err) throw err;
                  console.log("1 document inserted");
                  db.close();
                });
              });
                         
        
          }
      
        );

      });
  
      // Returns a '200 OK' response to all requests
      res.status(200).send('EVENT_RECEIVED');
    } else {
      // Returns a '404 Not Found' if event is not from a page subscription
      res.sendStatus(404);
    }
  
  });

  // Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

    // Your verify token. Should be a random string.
    let VERIFY_TOKEN = "<YOUR_VERIFY_TOKEN>"
      
    // Parse the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];
      
    // Checks if a token and mode is in the query string of the request
    if (mode && token) {
    
      // Checks the mode and token sent is correct
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        
        // Responds with the challenge token from the request
        console.log('WEBHOOK_VERIFIED');

        MongoClient.connect(url, function(err, db) {
          console.dir(err);
          if (err) throw err;
          var myobj = { mode: mode, 
                        token: token,
                        challenge: challenge };
          var dbo = db.db("BancarioBot");                
          dbo.collection("Webhook").insertOne(myobj, function(err, res) {
            if (err) throw err;
            console.log("1 document inserted");
            db.close();
          });
        });


        res.status(200).send(challenge);
      
      } else {
        // Responds with '403 Forbidden' if verify tokens do not match
        res.sendStatus(403);      
      }
    }
  });