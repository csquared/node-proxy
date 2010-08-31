require("./lib/js.class/core")
require("./lib/js.class/stdlib")
sys = require('sys'),
net = require('net')

/*************************************************************
* ============   The Forwarding Proxy Server ================
*
*  This file is an implementation of a Forwarding Proxy server
* using Node.js and JS.class.
*
*
*****************************************************************/


ForwardingProxy = new JS.Class({

  // uses parseInput to figure out 
  // if we got host:port or port
  initialize: function(proxy, main){
    this.proxy = this.parseInput(proxy);
    this.main  = this.parseInput(main);
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
    this.server = net.createServer(function (socket){
      socket.setEncoding("ascii");
      socket.addListener("data", function (data){
         klass.proxy_respond(socket, data)
      });
      socket.addListener("end", function(){ socket.end() });
    });
    
    //listen on proxy port
    this.server.listen(this.proxy[1], this.proxy[0]);
    sys.puts('Server running at http://'+this.proxy[0]+':'+this.proxy[1]+'');
    sys.puts('Responding from '+this.main[1]); 
  }, //start()


  /* Splits data from socket to two TCP connections.
     reponds on socket with one of their return values */
  proxy_respond: function(socket, data){ 
  //  sys.puts(data)

     sys.puts("Responding from " + this.main);
     var responder = net.createConnection(this.main[1], this.main[0]);
     responder.addListener("connect", function(){
       responder.write(data)
     })
     responder.addListener("data", function(responseData){
       if(socket.readyState == 'open'){ 
         socket.write(responseData)
       }else{
         responder.end()
       }
     })
     responder.addListener("end", function(){
       socket.destroy()
       responder.end()
     })
  }, //proxy_respond
  
  close: function(){
    this.server.close()
  }
});


process.argv.shift() //delete 'node'
$0 = process.argv.shift() //delete filename
if( $0 == __filename ){
  proxy = new ForwardingProxy(process.argv[0], 
                               process.argv[1])
  proxy.start()
  process.addListener('exit', function(){ 
    proxy.close()
  })
}
