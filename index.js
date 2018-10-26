var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const fs = require('fs');
const {EmoteFetcher, EmoteParser} = require('twitch-emoticons');

const fetcher = new EmoteFetcher();
const parser = new EmoteParser(fetcher, {
  type: 'markdown',
  match: /:(.+?):/g
});

// var api = require('twitch-api-v5');
var request = require('superagent');
const config = require('./config.json');

let commands = {};

fs.readdir(__dirname + "/commands", (err, items)=>{
  console.log(items);
  items.forEach((item) => {
    let name = item.replace('.js', '');
    commands[name] = require(__dirname +"/commands/"+item);
  })
})

const TwitchBot = require('twitch-bot');

const Bot = new TwitchBot({
  username: "CreativeBot",
  oauth:config.oauth,
  channels:['CreativeBuilds']
})

Promise.all([
  fetcher.fetchTwitchEmotes(),
  // fetcher.fetchBTTVEmotes()
]).then(() => {
  const kappa = fetcher.emotes.get('Kappa');
  console.log(kappa.toLink());

  Bot.on('message', chatter => {
    let message = chatter.message;
    let msgSplit = message.split(" ");
    var emote = fetcher.emotes.get(msgSplit[0]);
    if(emote){
      io.emit('showEmote', {link:emote.toLink(), chatter})
    } else {
      io.emit('chatter', chatter);
    }
  })

}).catch(err => {
  console.error('Test failed!');
  console.error(err);
});


Bot.on('message', chatter => {
  // console.log(chatter);
  let message = chatter.message;
  if(message[0] !== "!"){
    return;
  } 
  message = message.substr(1);
  let args = message.split(" ");
  let command = args.shift();
  if(!commands[command]){
    return;
  }
  commands[command].run({Bot, chatter, io, args});
})

// api.clientID = config.clientID;

let players = {};

function pollUsers(){
  // Contact twitch api to get current users in the channel;
  request.get('https://tmi.twitch.tv/group/user/creativebuilds/chatters')
  .end((err, res) => {
    if(err) throw err;
    players = {};
    let all = [];
    let chatters = res.body.chatters;
    all = all.concat(chatters.viewers).concat(chatters.staff).concat(chatters.admins).concat(chatters.global_mods);

    for(let x = 0; x < chatters.moderators.length; x++){
      players[chatters.moderators[x]] = {name: chatters.moderators[x], isMod: true}
    } 
 
    for(let x = 0; x < all.length; x++){
      players[all[x]] = {name: all[x], isMod: false}
    }

    io.emit("players", players);
  })
}

pollUsers();

setInterval(()=>{
  pollUsers();
},60000)

app.use(express.static(__dirname+'/public'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});
let started = Date.now();



io.on('connection', function(socket){
  // console.log('a user connected');
  if(started + 2000 >= Date.now()){
    socket.emit("refresh");
  }

  socket.on("requestPlayers", ()=>{
    Object.keys(players).forEach((key, index) => {
      socket.emit("playerJoin", players[key]);
    })
  })

  // TODO make a backend to store this info
  socket.on("gotCoin", obj => {
    console.log("User got coin", obj);
  })
});

http.listen(4545, function(){
  // console.log('listening on *:4545');
  
});