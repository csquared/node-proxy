//includes
require('../dupProxy');
assert = require('assert') 

// Setup Vars
var PROXYPORT       = 7000
var mainPort        = 9000
var dupPort         = 9001
var TESTMESSAGE     = "hello"


// We'll use an echo server as a test server
echoServer = new JS.Class({
  
  initialize: function(port){
   
    this.server = tcp.createServer(function (socket) {
      socket.setEncoding("utf8");
      socket.addListener("data", function (data) {
        echo_callback = true
        assert.equal(TESTMESSAGE, data)
        socket.write(data);
//        sys.puts('echoed ' + data)
      });
      socket.addListener("end", function(){
//        sys.puts("echo end")
        socket.close()
      })
    })
    this.server.listen(port)
  }

})


// setup the servers
responder = new echoServer(mainPort) 
duplicator = new echoServer(dupPort)
proxy = new DuplicatingProxy(PROXYPORT, mainPort, dupPort)
proxy.start()


// send a message to the proxy 
connection = tcp.createConnection(PROXYPORT)
connection.addListener("connect", function(){
//  sys.puts("writing message to proxy ")
  connection.write(TESTMESSAGE)
})
connection.addListener("data", function(data){
  send_callback = true
  assert.equal(data, TESTMESSAGE)
  connection.close()
})

//shut 'er down
connection.addListener("end", function(data){
//  sys.puts(" connection end ")
  proxy.close()
  responder.server.close()
  duplicator.server.close()
})



// make sure we actually got to the callbacks
process.addListener('exit', function(){ 
  sys.puts( "exiting") 
  assert.ok(echo_callback)
  assert.ok(send_callback)
})
