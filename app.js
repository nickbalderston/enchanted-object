var express = require('express');
var app = express();
var bodyParser = require('body-parser')
var http = require('http').Server(app);
var sockets = require('socket.io')(http);

const MongoClient = require('mongodb').MongoClient;
var db;

var five = require('johnny-five');
//const raspi = require('raspi-io');
var board = new five.Board();
var led, button, rgb, sensor;
var buttonIsPressed = false;

var recycledCounter;

MongoClient.connect('mongodb://nickcm:Shivers1@ds141889.mlab.com:41889/recycling', (err, client) => {
  if (err) return console.log(err);
  db = client.db('recycling');
        
  http.listen(3000, function() {
    console.log('listening on *:3000');
  });

  app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
    sockets.on('connect', function(socket) {
      console.log('a user connected');

      socket.on('disconnect', function() {
        console.log('user disconnected');
      });
    });
  }); 
  
  console.log("between functions");

  board.on("ready", function() {
    console.log("Board Ready!");

    var cursor = db.collection('recycled-counter').find();
        
    db.collection('recycled-counter').find().toArray(function(err, results) {
      recycledCounter = results[0].counter;
      console.log(results[0].counter);
    })
        
    //var motion = new five.Motion(7);

    var motion = new five.Motion({
      pin: 7,
      isPullup: true
    });
       
    motion.on("calibrated", function() {
      console.log("calibrated");
    });
          
    button = new five.Button(2);
            
    button.on("press", function() {
      console.log( "Button pressed" );
      //io.emit('blue button press', {}); // send to client
      buttonIsPressed = true;
    });

    button.on("release", function() {
      console.log( "Button released" );
      //io.emit('blue button release', {}); // send to client
      buttonIsPressed = false;
    });
        
    motion.on("motionend", function() {
      console.log("motionstart");
    });
        
    motion.on("motionstart", function() {
      console.log("motionend");
      console.log("recycledCounter1 = "+recycledCounter);
      if(buttonIsPressed == true){
        recycledCounter++;
        console.log("recycledCounter = "+ recycledCounter);
                
        var thisDocument = {$set: {counter: recycledCounter}};
                
        db.collection("recycled-counter").updateOne({ }, thisDocument, function(err, res) {
          if (err) throw err;
          console.log("recycled counter updated");
          //db.close();
        });
                
        sockets.emit('motionend', recycledCounter);
      }
    });    
  });     
})


