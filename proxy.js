process.mixin(GLOBAL, require("js.class/core"))
process.mixin(GLOBAL, require("js.class/stdlib"))

sys = require('sys'),
tcp = require('tcp')

DuplicatingProxy = new JS.Class({

  initialize: function(proxy, main, dup){
    this.proxy = this.parseInput(proxy);
    this.main  = this.parseInput(main);
    this.dup   = this.parseInput(dup);
  },

  parseInput: function( input ){
    if( /^\d+$/.test(input) )
      return new Array('localhost', input)
    else
      return input.split(':')
  },

  /*  Starts Proxy Server */
  start: function(){ 
    klass = this

    //create the server
    this.server = tcp.createServer(function (socket){
      socket.setEncoding("ascii");
      socket.addListener("data", function (data){
         //log incoming
         klass.proxy_respond(socket, data)
      });
      socket.addListener("end", function(){ socket.close() });
    });
    
    //listen on proxy
    this.server.listen(this.proxy[1], this.proxy[0]);
    sys.puts('Server running at http://'+this.proxy[0]+':'+this.proxy[1]+'');
  }, //start()


  /* Splits data from socket to two TCP connections.
     reponds on socket with one of their return values */
  proxy_respond: function(socket, data){ 
    sys.puts(data)

     sys.puts("Responding from " + this.main);
     var responder = tcp.createConnection(this.main[1], this.main[0]);
     responder.addListener("connect", function(){
       responder.write(data)
     })
     responder.addListener("close", function(){ 
       responder.close()
     })
     responder.addListener("data", function(responseData){
       socket.write(responseData)
     })

     sys.puts("Duplicating to " + this.dup)
     var duplicate = tcp.createConnection(this.dup[1], this.dup[0]);
     duplicate.addListener("connect", function(){
       duplicate.write(data)
     })
     duplicate.addListener("close", function(){ 
       duplicate.close()
     })
  } //proxy_respond
});



process.argv.shift() //delete 'node'
process.argv.shift() //delete filename
proxy = new DuplicatingProxy(process.argv[0], process.argv[1], process.argv[2])
proxy.start()

