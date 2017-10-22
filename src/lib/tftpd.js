/*
  pagina git: https://github.com/gagle/node-tftp#server_listen
*/

"use strict";

let tftp = require("tftp");

let tftpd = function() {};

tftpd.prototype.start = function(host, root) {
  var connections = [];

  var server = tftp.createServer({
    host: host,
    port: 69,
    root: root
  });

  server.on("request", function(req) {
    req.on("error", function(error) {
      //Error from the request
      console.error(error);
    });

    //Save the connection
    connections.push(req);

    //The "close" event is fired when the internal socket closes, regardless
    //whether it is produced by an error, the socket closes naturally due to the
    //end of the transfer or the transfer has been aborted
    req.on("close", function() {
      //Remove the connection
      connections.splice(connections.indexOf(this), 1);
      if (closed && !connections.length) {
        //The server and all the connections have been closed
        console.log("Server closed");
      }
    });
  });

  server.on("error", function(error) {
    //Errors from the main socket
    console.error(error);
  });

  server.listen();
  var closed = false;
}

export default new tftpd();
