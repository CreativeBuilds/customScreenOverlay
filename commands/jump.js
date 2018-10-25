module.exports = {
    "run": ({Bot, chatter, io})=>{
        console.log('user jumped!', chatter.username);
        console.log("io", io.emit);
        io.emit('userJumped', chatter.username)
    }
};