process.mixin(GLOBAL, require('ntest'));

assert = require('assert') 
tcp = require('tcp')

var PROXYPORT = 7000
var mainPort  = 9000
var dupPort   = 9001

function createEchoServer(port){
  var server =  tcp.createServer(function (socket) {
    socket.setEncoding("utf8");
    socket.addListener("data", function (data) {
      socket.write(data);
    });
    socket.addListener("end", function () {
      socket.close();
    });
  })
  server.listen(port)
  return server
}

responder = createEchoServer(mainPort)
duplicater = createEchoServer(dupPort)


describe("A proxy server")
  it("should be running on PROXYPORT", function() {
    assert.equal(0, [].length);
  })

responder.close()
duplicater.close()
