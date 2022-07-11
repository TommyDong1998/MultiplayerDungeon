const readline = require('readline');



class Console{
    constructor(){
        this.rl=readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        this.getCommand();
    }

    getCommand(){
          this.rl.question('>Type a command\n',this.processCommand.bind(this));
    }

    processCommand(input){
        console.log(input);
        this.getCommand();
    }
}

let test= new Console();