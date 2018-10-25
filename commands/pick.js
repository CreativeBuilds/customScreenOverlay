module.exports = {
    "run": ({Bot, chatter, io, args})=>{
        let num = args[0];
        num =parseInt(num);
        if(num <= 8 && num > 0){
            io.emit('setCharacter', {name: chatter.username, num})
        }
        
    }
};