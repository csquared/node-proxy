//requires
process.mixin(GLOBAL, require("./lib/js.class/core"))
process.mixin(GLOBAL, require("./lib/js.class/stdlib"))
sys = require('sys'),
tcp = require('tcp')

/*************************************************************
* ============   The Duplicating Proxy Server ================
*
*  This file is an implementation of a Duplicating Proxy server
* using Node.js and JS.class.
*
*   Node.js makes event-driven server-side javascript FAST and 
* simple - to a point.  The event-driven paradigm is tough to
* grok when you come from a procedural world.  JS.Class lets
* me write javascript like its Ruby.  And I love Ruby.
*
* The idea of the duplicating proxy is simple: 
*  - listen for traffic on one port.
*  - forward the traffic to two servers
*  - reply with the response of one of the servers
*
* You can run this file like so:
*   node dupProxy.js [proxy server] [responding server] [duplication server]
*   
*   A server is specified as either host:port or just port
*
*   ex node dupProxy.js 8000 3000 jimsmachine.com:3500
*
*   Would start the proxy on port 8000 on localhost.
*    This will forward tcp traffic to port 3000 at the localhost and
*    port 3500 at jimsmachine.com 
*
*****************************************************************/


DuplicatingProxy = new JS.Class({

  // uses parseInput to figure out 
  // if we got host:port or port
  initialize: function(proxy, main, dup){
    this.proxy = this.parseInput(proxy);
    this.main  = this.parseInput(main);
    this.dup   = this.parseInput(dup);
  },

  /*************************************
  *  
  *  Distinguishes between host:port#
  *  and just port# by doing a RegEx 
  *  test to see if the string is all
  *  digits.  If it is not, then it
  *  is split on a colon.
  *  Assumes 'localhost' when no port
  *  specified.
  *   
  *  RETURNS 
  *     array of strings -
  *     [host, port] 
  */
  parseInput: function( input ){
    input = new String(input)
    if( /^\d+$/.test(input) )
      return new Array('localhost', input)
    else
      return input.split(':')
  },

  
  /* Creates a port listening on the initialized proxy
   *  port that uses self.proxy_respond to handle the
   *  response 
   */
  start: function(){ 
    klass = this

    //create the server
    this.server = tcp.createServer(function (socket){
      socket.setEncoding("ascii");
      socket.addListener("data", function (data){
         klass.proxy_respond(socket, data)
      });
      socket.addListener("end", function(){ socket.close() });
    });
    
    //listen on proxy port
    this.server.listen(this.proxy[1], this.proxy[0]);
    sys.puts('Server running at http://'+this.proxy[0]+':'+this.proxy[1]+'');
    sys.puts('Responding from '+this.main[1]+"\n"
              +'Duping to ' + this.dup[1]);
  }, //start()


  /* Splits data from socket to two TCP connections.
     reponds on socket with one of their return values */
  proxy_respond: function(socket, data){ 
  //  sys.puts(data)

     sys.puts("Responding from " + this.main);
     var responder = tcp.createConnection(this.main[1], this.main[0]);
     responder.addListener("connect", function(){
       responder.write(data)
     })
     responder.addListener("data", function(responseData){
       socket.write(responseData)
       responder.close()
     })

     sys.puts("Duplicating to " + this.dup)
     var duplicate = tcp.createConnection(this.dup[1], this.dup[0]);
     duplicate.addListener("connect", function(){
       duplicate.write(data)
       duplicate.close()
     })
  }, //proxy_respond
  
  close: function(){
    this.server.close()
  }
});


process.argv.shift() //delete 'node'
$0 = process.argv.shift() //delete filename
if( $0 == __filename ){
  proxy = new DuplicatingProxy(process.argv[0], 
                               process.argv[1], 
                               process.argv[2])
  proxy.start()
  process.addListener('exit', function(){ 
    proxy.close()
  })
}
