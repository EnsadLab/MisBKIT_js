/**
 * Created by Didier  02/07/16.
 */
/*
var MsgAscii = function(str){
    this.buffer = Buffer.alloc(256);
    this.head = (str)? this.buffer.write(str,0) :0;
    this.end  = this.head;
};
MsgAscii.prototype.encode = function(str,array){
    if(str) this.head = this.buffer.write(str,0);
    var i0 = this.head;
    var l = array.length;
    for(var i=0;i<l;i++){
        i0+=this.buffer.write(","+array[i],i0);
    }
    this.buffer[i0++]=10;
    this.end = i0;
    //this.buffer.write("abc",0);
    console.log("MsgAscii:",this.buffer.toString('ascii',0,i0));
    //cm9Com.write(this.buffer.slice(0,i0));
    console.log(this.decode(this.buffer.slice(0,i0)));
};
MsgAscii.prototype.addDatas = function(buff){

}
MsgAscii.prototype.decode = function(buff){
    var str = buff.toString('ascii');
    return str.split(',');
}
*/

/*
var cbor = require('cbor');
var Msg = function(){
    this.test = function() {
        var num = this.encode({"next":256});
        console.log("num length:",num.length);

        var str = "dxl/pos 11,-1000,12,1203,13,1023,14,1230,15,1230\r";
        var str = "dxl/temp  11,-1000,12,1203,13,1023,14,1230,15,1230\r";
        console.log("str length:",str.length);

        var ascii= new MsgAscii("zqwxsdrtf");
        ascii.encode(null,[123,456,-789]);
        ascii.encode("line",[123]);


        var obj = [45,"pos",[11,-1000],[12,1203],[13,1023],[14,1230],[15,1230]];
        var msg = this.encode(obj);
        var json = JSON.stringify(obj,null);
        console.log("json length:",json.length);
        console.log("encoded length:", msg.length);
        this.decode(msg);
    }
};

Msg.prototype.encode = function(obj){
    return cbor.encode(obj);
};
Msg.prototype.decode = function(msg){
    cbor.decodeFirst(msg,function(error,obj){
        if(error)console.log("decode cbor error:",error);
        else{  console.log("decode cbor:",obj);}

    });

};
*/
