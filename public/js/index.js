let app = new PIXI.Application({ 
    width: 1920,         // default: 800
    height: 256,        // default: 600
    antialias: true,    // default: false
    transparent: true, // default: false
    resolution: 1       // default: 1
  }
);
let players = {};

let TextureCache = PIXI.utils.TextureCache;
let Rectangle = PIXI.Rectangle;
let Sprite = PIXI.Sprite;

let fiftyFifty = function(){
  if(Math.random() < 0.5){
    return true;
  } else {
    return false;
  }
}

function clone(obj) {
  if (null == obj || "object" != typeof obj) return obj;
  var copy = obj.constructor();
  for (var attr in obj) {
      if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
  }
  return copy;
}

socket.on('refresh', ()=>{
  window.location.reload();
})

document.body.appendChild(app.view);
// app.renderer.backgroundColor = 0xf1f1f1

// Create class object for players
class Player {
  constructor(img, name, userType){
    this.img = img;
    this.name = name;
    this.y = 0;
    
    // Gets a random value between the borders of each side
    this.x = Math.floor(Math.random() * 1920-31); 
    this.speed = Math.random() + 1;
    this.yVelocity = 0;
    this.loop = 0;
    // True go forwards / False go backwards
    this.loopDirection = true;
    // 1 is true 2 is false
    this.isGoingRight = fiftyFifty();
    this.isJumping = false;
    if(!userType || userType < 0 || userType > 7){
      this.userType = Math.floor(Math.random() * 8);
    }
    this.lastUpdated = Date.now();
    this.chattedAt = null;
    // this.sprite = new PIXI.Sprite(
    //   PIXI.loader.resources[img].texture
    // );

    // this.sprite = new PIXI.Graphics();
    // this.sprite.beginFill(parseInt("0x"+(Math.floor(Math.random()*16777215).toString(16))));
    // this.sprite.drawRect(0,0,32,32);
    let texture = new PIXI.Texture(TextureCache["/imgs/sprites.png"]);
    console.log(texture);
    if(this.userType > 3){
      // Bottom row
      this.startingX = (this.userType-4)*96;
      this.startingY = 136;
    } else {
      // Top row
      this.startingX = this.userType * 96;
      this.startingY = 0;
    }
    if(this.isGoingRight){
      this.startingY += 68;
    } else {
      this.startingY += 34;
    }
    console.log(this.userType, this.startingX, this.startingY);

    let rectangle = new Rectangle(this.startingX,this.startingY,32,34);

    texture.frame = rectangle;
    this.texture = texture;
    this.sprite = new Sprite(texture)
    this.sprite.scale = {x:1.5,y:1.5};
    app.stage.addChild(this.sprite);
  }
}

Player.prototype.handleY = function(delta){
  if(this.yVelocity > 0.08){
    this.yVelocity = this.yVelocity - (0.08 * delta);
  } else {
    this.yVelocity = 0;
  }

  if(this.yVelocity > 0){
    this.y = this.y - (this.yVelocity* delta);
  }

  this.y += (6 * delta);

  if(this.y > 256-51){
    this.y = 256-51;
    this.isJumping = false;
  }
}

Player.prototype.handleChatter = function(delta){
  if(this.chattedAt && this.chattedAt + 3000 > Date.now()){
    // Display the chat message
    if(this.chatObject && this.chattedImg){
      // Update the position
      this.chatObject.visible = true;
      this.chatObject.x = this.x + 12;
      this.chatObject.y = this.y - 40;
      
    } else if(this.chatObject){
      this.chatObject.visible = true;
      this.chatObject.x = this.x;
      this.chatObject.y = this.y - 32;
    } else {
      // Make a chat object;
      let img = "/imgs/chat.png";
      if(this.chattedImg){
        this.chatObject = new PIXI.Sprite.fromImage(this.chattedImg);
        this.chatObject.scale = {x:1/7*8,y:1/7*8};
        this.chatObject.x = this.x + 12;
        this.chatObject.y = this.y - 32;
      } else {
        this.chatObject = new PIXI.Sprite(
          PIXI.loader.resources["/imgs/chat.png"].texture
        );
        this.chatObject.x = this.x;
        this.chatObject.y = this.y - 32;
      }
      
      
      app.stage.addChild(this.chatObject);
    }
  } else if(this.chatObject){
    this.chatObject.visible = false;
    app.stage.removeChild(this.chatObject);
    this.chatObject = null;
    this.chattedImg = null;
  }
}

Player.prototype.update = function(delta){
  if(this.lastUpdated + 200 <= Date.now()){
    // 0.5 seconds have passed!
    if(this.loopDirection){
      this.loop++;
      if(this.loop > 2){
        this.loop = 1;
        this.loopDirection = false;
      }
    } else {
      this.loop--;
      if(this.loop < 0){
        this.loop = 1;
        this.loopDirection = true;
      }
    }

    if(this.userType > 3){
      // Bottom row
      this.startingX = ((this.userType-4)*96)+(32*this.loop);
      this.startingY = 136;
    } else {
      // Top row
      this.startingX = (this.userType * 96)+(32*this.loop);
      this.startingY = 0;
    }
    if(this.isGoingRight){
      this.startingY += 68;
    } else {
      this.startingY += 34;
    }
    let rectangle = new Rectangle(this.startingX,this.startingY,32,34);
    this.texture.frame = rectangle;
    this.lastUpdated = Date.now();
  }


  // Check to see if the user is about to hit the wall or not
  if(this.x >= 1920-51 && this.isGoingRight){
    this.isGoingRight = !this.isGoingRight;
  } else if(this.x <= 0 && !this.isGoingRight){
    this.isGoingRight = !this.isGoingRight;
  }
  let removeSpeed = fiftyFifty();
  if(removeSpeed && this.speed > 1){
    this.speed -= 0.01;
  } else if(!removeSpeed && this.speed < 2){
    this.speed += 0.01;
  }

  // Handle Y position
  this.isFalling = this.handleY(delta);

  // Checks to see which direction the character is headed and sends them in that direction
  if(!this.isFalling){
    if(this.isGoingRight){
      this.x += this.speed * delta;
    } else {
      this.x -= this.speed * delta;
    }
  }
  this.sprite.x = this.x;
  this.sprite.y = this.y;
  this.handleChatter();
}

Player.prototype.jump = function(){
  if(this.isJumping === true){
    return;
  }
  this.isJumping = true;
  this.yVelocity = 10;
}

Player.prototype.disconnect = function(){
  app.stage.removeChild(this.sprite);
  players[this.name] = null;
}



// Game Tick
app.ticker.add(function(delta){
  // Updates each player every tick!
  Object.keys(players).forEach(key => {
    // console.log(player);
    if(!players[key]) return;
    players[key].update(delta);
  })
})
// Loads all of our images
PIXI.loader
.add("/imgs/player.png")
.add("/imgs/sprites.png")
.add("/imgs/chat.png")
.load(setup)
// Runs on setup
function setup() {
  socket.emit("requestPlayers");
  socket.on("players", (Players)=>{
    // Players is an object;
    Object.keys(Players).forEach((key)=>{
      if(!players[key]){
        players[user.name] = new Player("/imgs/player.png", user.name);
      } 
    })
    Object.keys(players).forEach((key)=>{
      if(!Players[key]){
        // User has disconnected
        players[key].disconnect();
      }
    })
  }) 
  socket.on("playerJoin", (user)=>{
    /* USER OBJECT
    name: Name of the twitch viewers
    isSub: true or false bool if user is subbed
    isMod: true or false bool if user is modded
    */ 
   console.log(user);
   if(players[user.name]) return;
   players[user.name] = new Player("/imgs/player.png", user.name);
  });

  socket.on('userJumped', (user)=>{
    console.log(user, players[user])
    players[user].jump()
  })

  socket.on("chatter", (chatter) => {
    let owner = chatter.username;
    if(!players[owner]){
      players[user.name] = new Player("/imgs/player.png", user.name);
    }
    players[owner].chattedAt = Date.now();
  });

  socket.on("showEmote", (message) => {
    console.log(message);
    let chatter = message.chatter;
    let link = message.link;
    let owner = chatter.username;
    if(!players[owner]){
      players[user.name] = new Player("/imgs/player.png", user.name);
    }
    players[owner].chattedAt = Date.now();
    players[owner].chattedImg = link;
    console.log(link);
  })

  socket.on("setCharacter", (obj)=>{
    console.log("setCharacter", obj);
    if(!players[obj.name]) {
      players[obj.name] = new Player("/imgs/player.png", obj.name, obj.num);
    }
    players[obj.name].userType = obj.num - 1;
  })

  test = ()=>{
    players['creativebot'].jump();
  }
}