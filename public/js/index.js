let app = new PIXI.Application({ 
    width: 1920,         // default: 800
    height: 256,        // default: 600
    antialias: true,    // default: false
    transparent: true, // default: false
    resolution: 1       // default: 1
  }
);
console.log(EventEmitter);

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

let players = {};
let coins = {};

let TextureCache = PIXI.utils.TextureCache;
let Rectangle = PIXI.Rectangle;

PIXI.Sprite.prototype.getID = function(){
  if(!this.id){
    this.id = uuidv4();
  }
  return this.id;
}

let Sprite = PIXI.Sprite;

let fiftyFifty = function(){
  if(Math.random() < 0.5){
    return true;
  } else {
    return false;
  }
}

function chance(inChance){
  if(inChance === 0) return;
  if(isNaN(parseFloat(inChance))) return;
  inChance = parseFloat(inChance);
  // console.log('inchance', inchance);
  let chance = 1/inChance;
  if(Math.random() <= chance){
    return true;
  } else {
    return false;
  }
}

let GlobalEvents = new EventEmitter();

GlobalEvents.on('newCollision', function(collisionInfo){
  // {obj1: this, obj2: testObj, collisionObj: determineObj}
  let obj1 = collisionInfo.obj1;
  let obj2 = collisionInfo.obj2;
  let collisionObj = collisionInfo.collisionObj;
})

GlobalEvents.on('sustainCollision', function(collisionInfo){
  let obj1 = collisionInfo.obj1;
  let obj2 = collisionInfo.obj2;
  let collisionObj = collisionInfo.collisionObj;
})

GlobalEvents.on('endCollision', function(collisionInfo){
  let obj1 = collisionInfo.obj1;
  let obj2 = collisionInfo.obj2;
  let collisionObj = collisionInfo.collisionObj;
})

function clone(obj) {
  if (null == obj || "object" != typeof obj) return obj;
  var copy = obj.constructor();
  for (var attr in obj) {
      if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
  }
  return copy;
}

function determineCollide(sprite1, sprite2){
  // Determine if sprite1 is hitting sprite2
  let width1 = sprite1.width;
  let width2 = sprite2.width;
  let height1 = sprite1.height;
  let height2 = sprite2.height;

  let x1 = sprite1.x;
  let x2 = sprite2.x;
  let y1 = sprite1.y;
  let y2 = sprite2.y;

  let boundingBox1 = {xMin:x1, xMax: x1 + width1, yMin: y1, yMax: y1+height1};
  let boundingBox2 = {xMin:x2, xMax: x2 + width2, yMin: y2, yMax: y2+height2};

  if(boundingBox2.xMin >= boundingBox1.xMin && boundingBox2.xMin <= boundingBox1.xMax){
    // It overlaps, boundingBox2 is coming from the right side
    // console.log("Coming from the left side!");
    return {right: false, left:true};
  } else if(boundingBox2.xMax >= boundingBox1.xMin && boundingBox2.xMax <= boundingBox1.xMax){
    // console.log("Coming from the right side!");
    return {right:true, left:false}
  } else {
    return false;
  }

  // console.log(boundingBox1, boundingBox2);
}

socket.on('refresh', ()=>{
  window.location.reload();
})

document.body.appendChild(app.view);
// app.renderer.backgroundColor = 0xf1f1f1

class Coin {
  constructor(id){
    if(!id){
      id = uuidv4();
    }
    this.id = id;
    this.x = Math.floor(Math.random() * 1920-31); 
    this.y = 256-(24*1.5);
    this.value = Math.floor(Math.random() * 10) + 1; 
    this.sprite = new PIXI.Sprite(
      PIXI.loader.resources["/imgs/coin.png"].texture
    );
    this.sprite.x = this.x;
    this.sprite.y = this.y
    app.stage.addChild(this.sprite);
    GlobalEvents.on("newCollision", (info)=>{
      if(info.obj2.id === this.id){
        if(info.obj1 instanceof Player){
          info.obj1.EventEmitter.emit("gotCoin", {value:this.value})
        }
        app.stage.removeChild(this.sprite);
        delete coins[this.id];
      }
    })
    // setTimeout(()=>{
    //   app.stage.removeChild(this.sprite);
    //   delete coins[this.id];
    // },10000)
  }
}

// Create class object for players
class Player {
  constructor(img, name, userType){
    this.img = img;
    this.name = name;
    this.y = 0;
    this.id = uuidv4();
    this.coins = 0;
    
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
    this.collisions = [];
    this.animationsAbove = [];
    this.EventEmitter = new EventEmitter();

    this.EventEmitter.on("gotCoin", (coinInfo)=>{
      let value = coinInfo.value;
      this.coins += value;
      console.log(this.name, "earned", value, "from coin! Total coins are", this.coins);
      this.animateAbove(new PIXI.Sprite(
        PIXI.loader.resources["/imgs/coin.png"].texture
      ), new PIXI.Text(`+${value}`,{fontFamily : 'Arial', fontSize: 16, fill : 0xf1f1f1, align : 'center'}));
      socket.emit("gotCoin", {value, username: this.name});
    })
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

Player.prototype.handleAnimationsAbove = function(delta){
  this.animationsAbove.forEach(obj => {
    if(Date.now() > obj.date + obj.time){
      this.sprite.removeChild(obj.sprite);
      return delete this.animationsAbove[obj];
    }
    obj.sprite.y -= (obj.decreaseY * delta);
  })
}

Player.prototype.animateAbove = function(sprite, text){
  
  if(text){
    text.y = -24;
    setTimeout(()=>{
      this.sprite.addChild(text);
      text.x = (text.parent.width/2)-text.width;
      this.animationsAbove.push({sprite:text,date:Date.now(),time:2500, decreaseY: 0.08 })
    },100)
  }
  if(sprite){
    this.sprite.addChild(sprite);
    sprite.y = -36;
    sprite.height = 16;
    sprite.width = 16;
    sprite.x = (sprite.parent.width/2)-16;

    this.animationsAbove.push({sprite, date:Date.now(), time: 2500, decreaseY: 0.1});
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

  this.testCollisions(players);
  this.testCollisions(coins);
  this.handleAnimationsAbove(delta);
  this.sprite.getID();
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

Player.prototype.testCollisions = function(objectOfObjects){
  Object.keys(objectOfObjects).forEach(key => {
    if(this == null || !this || !this.sprite) return;
    let testObj = objectOfObjects[key];
    if(testObj == null || !testObj || !testObj.sprite) return;
    let t0 = performance.now();
    // Get our current bounding box area and console log it
    let thisBounds = this.sprite.getBounds()
    testObj.sprite.getBounds();
    // Either returns false or with an object;
    let determineObj = determineCollide(this.sprite, testObj.sprite);
    let info = {obj1: this, obj2: testObj, collisionObj: determineObj};
    if(determineObj){
      // Current object is colliding with user
      if(!this.collisions[testObj.sprite.getID()]){
        GlobalEvents.emit("newCollision", info);
        this.collisions[testObj.sprite.getID()] = determineObj;
      } else {
        // Sustain collision
        GlobalEvents.emit("sustainCollision", info);
      }
    } else if(this.collisions[testObj.sprite.getID()]){
      this.collisions[testObj.sprite.getID()] = null;
      GlobalEvents.emit("endCollision", info)
    }
    let t1 = performance.now();
    // console.log(`Took ${t1 - t0} milliseconds`);
  })
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
  // one in 250 chance to spawn a new coin!
  if(chance(250)){
    let id = uuidv4();
    coins[id] = new Coin(id);
  }
})
// Loads all of our images
PIXI.loader
.add("/imgs/player.png")
.add("/imgs/sprites.png")
.add("/imgs/chat.png")
.add("/imgs/coin.png")
.load(setup)
// Runs on setup
function setup() {
  socket.emit("requestPlayers");
  socket.on("players", (Players)=>{
    // Players is an object;
    console.log("Got players", Players, players);
    if(Players !== players){
      Object.keys(Players).forEach((key)=>{
        let user = Players[key];
        if(!players[key]){
          players[user.name] = new Player("/imgs/player.png", user.name);
        } 
      })
      Object.keys(players).forEach((key)=>{
        if(!players[key] || players[key] == null) return;
        if(!Players[key]){
          // User has disconnected
          players[key].disconnect();
        }
      })
    }
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
      players[owner] = new Player("/imgs/player.png", owner);
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