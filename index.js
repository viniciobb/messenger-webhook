'use strict';

// Imports dependencies and set up http server
const
  express = require('express'),
  fetch = require('node-fetch'),
  request = require('request'),
  bodyParser = require('body-parser'),
  app = express().use(bodyParser.json()); // creates express http server
  
  var MongoClient = require('mongodb').MongoClient;
  var url = "mongodb://vinicioMongo:123mongo@cluster0-shard-00-00-lsstx.mongodb.net:27017,cluster0-shard-00-01-lsstx.mongodb.net:27017,cluster0-shard-00-02-lsstx.mongodb.net:27017/BancarioBot?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true";
  var CLIENT_TOKEN = '4TMZFCK5FZUGFDFIRXRJNVY4Y4SEMRDZ'; // TCC-BANCARIO
  //var CLIENT_TOKEN = 'CFPCUH3V443ESVXTNEGTZSPHHRXNHEBX'; // BANCARIO
  
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

        // Check if the event is a message or postback and
        // pass the event to the appropriate handler function

        if (webhook_event.message) {
          console.log("chamou handleMessage");
          handleMessage(sender_psid, webhook_event.message);        
        } else if (webhook_event.postback) {
          handlePostback(sender_psid, webhook_event.postback);
        }
        
        //console.log(webhook_event);
        //console.log("webhook_event.message");
        //console.log(webhook_event.message);
      

      //   const q = encodeURIComponent(webhook_event.message.text);
      //   const uri = 'https://api.wit.ai/message?q=' + q;
      //   const auth = 'Bearer ' + CLIENT_TOKEN;
      //   fetch(uri, {headers: {Authorization: auth}})
      //   .then(res => res.json())
      //   .then(res => {
          
      //         console.dir(res);

      //         console.log(res._text);
      //         console.log(res.entities);

      //         MongoClient.connect(url, function(err, db) {
      //           if (err) throw err;
      //           var dbo = db.db("BancarioBot");

      //           var myobj = { 
      //             sender_psid: sender_psid,
      //             webhook_event: webhook_event, 
      //             respostaWIT: res
      //           };

      //           dbo.collection("Message").insertOne(myobj, function(err, res) {
      //             if (err) throw err;
      //             console.log("1 document inserted");
      //             db.close();
      //           });
      //         });
                         
        
      //     }
      
      //   );

       });
  
      // Returns a '200 OK' response to all requests
      res.status(200).send('EVENT_RECEIVED');
    } else {
      // Returns a '404 Not Found' if event is not from a page subscription
      res.sendStatus(404);
    }
  
  });

  // Handles messages events
function handleMessage(sender_psid, received_message) {

  console.log("entrou handleMessage");

  let response;
  let responseText = "";
  let propriedades = {};
  let obrigatorios = 3;


  // Check if the message contains text

  console.log("received_message.text : "+ received_message.text);

  if (received_message.text) {    

    // Create the payload for a basic text message
    //response = {
      //"text": `You sent the message: "${received_message.text}". Now send me an image!`
    //}

    const q = encodeURIComponent(received_message.text);
    const uri = 'https://api.wit.ai/message?q=' + q;
    const auth = 'Bearer ' + CLIENT_TOKEN;
    fetch(uri, {headers: {Authorization: auth}})
    .then(res => res.json())
    .then(res => {
      
          console.dir(res);

          //console.log(res._text);
          //console.log(res.entities);

          //response = {
            //"text": JSON.stringify(res)
          //};

//          console.log(response);
//          console.dir(response);

          if(isEmptyObject(res.entities)){

             response = {
              "text": " Não entendi a solicitação. Estou preparado para fazer transferências."
            };

          }else{

            for (var property in res.entities){
             
              if( (property == "transferencia") || (property == "conta_corrente") || (property == "agencia")) {
                
                responseText = property + " " + responseText;


              }
              else{
                if((property == "tipo_conta_corrente") || (property == "tipo_agencia") || (property == "amount_of_money")){

                  responseText = res.entities[property][0].value + " " +responseText;

                }

              }
            }

          }

          console.log("responseText : " + responseText);
          console.log("res.entities.length : " + res.entities.length);

          if(responseText.length > 0 && res.entities.length > 6){

            response = {
              "text": responseText   
            };

          }else if(responseText.length > 0){

            response = {
              "text": "Dados insuficientes : ex: transferir para agencia XXX conta-corrente xxx valor xxxx "   
            };

          }else{

            response = {
              "text": "Não entendi ! Sou um bot e estou programado para fazer transferências"   
            };

          }

          

          console.log("chamou callSendAPI" ); 
  
          // Sends the response message
          callSendAPI(sender_psid, response);



          // MongoClient.connect(url, function(err, db) {
          //   if (err) throw err;
          //   var dbo = db.db("BancarioBot");

          //   var myobj = { 
          //     sender_psid: sender_psid,
          //     webhook_event: webhook_event, 
          //     respostaWIT: res
          //   };

          //   dbo.collection("Message").insertOne(myobj, function(err, res) {
          //     if (err) throw err;
          //     console.log("1 document inserted");
          //     db.close();
          //   });
          // });
                      
    
      }
  
    );



  }  

  

}


//What about making a simple function?

function isEmptyObject(obj) {
  for(var prop in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, prop)) {
      return false;
    }
  }
  return true;
}



function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }

  console.dir(request_body );


  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": "EAAEbkIH10nMBALz5WzR2QfunWapZCi4Ab1rpu7IJr59ZBpkfcHZBcc93rfc0ZAAtsSOWMZAIgZC0OsIKZCaRspZBQkxSOu3tuPAotgrQe7PG3xqYPSQuRlYppKOJ7lZBXZARu3IdQEklDgN4tOZB9LrFoLspX0rfNLVZCI3DPZCJPkFzKNNQ5fAqIzXPZA" },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  }); 
}

// function callSendAPI(sender_psid, response) {
//   // Construct the message body
//   let request_body = {
//     "recipient": {
//       "id": sender_psid
//     },
//     "message": response
//   };

//   // Send the HTTP request to the Messenger Platform
//   request({
//     "uri": "https://graph.facebook.com/v2.6/me/messages",
//     "qs": { "access_token": "EAAEbkIH10nMBALMzQAk8poEdrVT70GjZC1q4ZClwSSZCh1OVweiU4RZAmwMjpltQwmHol4ZB9ZCSieZCK9EC04CpAZCueqSNSZBkkFvD4iechYr9BksdisQZCgkGQeBNsH64GPZBg0AHG2tSzPIp9KGDv7fbXGjyf0UzZAjQoYgarsVFavDXP6G2aXkp4UjPzYm1vrZCX4OZADvHdRhAZDZD" },
//     "method": "POST",
//     "json": request_body
//   }, (err, res, body) => {
//     if (!err) {
//       console.log('message sent!')
//     } else {
//       console.error("Unable to send message:" + err);
//     }
//   }); 

// }

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
  console.log("handlePostback");
}


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