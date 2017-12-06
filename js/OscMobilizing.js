http = require("http");

var server = http.createServer(function(req,res){
    console.log("Mobilizing server request!");
    res.writeHead(200, {
        'Access-Control-Allow-Origin' : '*'
    });
});

var io = require("socket.io")(server);

io.on('connection', function(socket) {
    console.log('io connected');
    
    socket.on('message', function(data){
        console.log("got message:",data);
    });	

    socket.on("osc", function (obj) {
        console.log("osc:",obj.args[0]);
        oscManager.handleMessage(obj);
    });

    socket.on('disconnect', function(){
        console.log("=============== DISCONNEXION ============");  
    });
});

server.listen(8080, function(){
    console.log("Listening to port 8080");
});

