/**
 * Created by Didier on 24/04/16.
 */

var DUI = DUI || {};

DUI.Widget = function(svg,params){
    var self = this;
    var rect = svg.getBoundingClientRect();
    this.svg = svg;
    this.x = params.x ? params.x : 0;
    this.y = params.y ? params.y : 0;
    this.width     = params.w  ? params.w  :rect.width;
    this.height    = params.h  ? params.h  :rect.height;
    this.callback  = params.cb ? params.cb : null;

    this.value = 0;
    this.userData = null;

    this.mainGroup = d3.select(svg)
        .append('g')
        .attr('transform','translate('+self.x+','+ self.y+')');
};
DUI.Widget.prototype.setValue = function(v){
    this.value = v;
}


DUI.Toggle = function(svg,params){
    DUI.Widget.call(this,svg,params); //call constructor
    var self = this;

    this.togs = [{t:"W",c:"#e3e3e3"},{t:"J",c:"#792d3e"}];

    this.mainGroup.on('click',function(d){
            var v = self.value+1;
            if(v>=self.togs.length)v=0;//loop
            self.setValue(v);
        });

    this.rect = this.mainGroup.append("rect")
        .attr('width', self.width)
        .attr('height',self.height)
        .style("stroke", "none")
        .style("fill", self.togs[0].c)

    this.text = this.mainGroup.append("text")
        .attr("x",self.width*0.5)
        .attr("y",self.height*0.5 + 5)
        .attr("text-anchor", "middle")
        .attr("font-size","14")
        .attr("font-family","sans-serif")
        .attr("contentEditable", true)
        .style("fill","#FFFFFF")
        .text(self.togs[0].t)
        .style("cursor", "default")

        ;

};//Toggle
DUI.Toggle.prototype = Object.create(DUI.Widget.prototype);
//SubClass.prototype.constructor = SubClass;

DUI.Toggle.prototype.setValue=function(v){
    if( (v>=0)&&(v<this.togs.length)) {
        this.rect.style('fill', this.togs[v].c);
        //this.text.style("fill",this.textColor);
        this.text.text(this.togs[v].t);
        this.value = v;
        if (this.callback) this.callback(v,self);
    }
    return this;
}
DUI.Toggle.prototype.setOptions=function(opts){
    this.togs = opts.slice(0); //copy
    this.setValue(this.value);
    return this;
}
DUI.Toggle.prototype.textColor = function(c){
    this.text.style("fill",c);
    return this;
}

DUI.Progress = function(svg,params){
    DUI.Widget.call(this,svg,params); //call constructor

    this.bkg = this.mainGroup.append("rect")
        .attr('width', self.width  )
        .attr('height',self.height )
        .style("stroke", "none")
        .style("fill", "#C0C0C0")
    ;
    this.cursor = this.mainGroup.append("rect")
        .attr('width', 0  )
        .attr('height',self.height )
        .style("stroke", "none")
        .style("fill", "#009933")
    ;
}
DUI.Progress.prototype = Object.create(DUI.Widget.prototype);
DUI.Progress.prototype.setValue=function(v){ //en %
    this.cursor.attr('width',v*this.width*0.001);
}



//----------------------------------------- V_Slider
DUI.Slider_V = function(svg,params) {
    DUI.Widget.call(this,svg,params); //call constructor

    var self = this;
    this.hCursor = self.height*0.5;
    this.value  = 50;
    this.wheelCoef = 1.0/3.0;

    this.scale = d3.scale.linear()
        .domain([this.height,0])
        .range([0,1])
        .clamp(true);

    this.drag = d3.behavior.drag()
        .on("drag",function(d){
            self.setValue(self.scale(self.hCursor+d3.event.dy));
        });

    this.mainGroup
        .style("cursor", "ns-resize")
        .call(self.drag)
        .on("wheel.zoom",function(d){
            self.setValue(self.scale(self.hCursor+d3.event.wheelDeltaY*self.wheelCoef));
            //d3.event.sourceEvent.stopPropagation();
            //d3.event.sourceEvent.preventDefault();
        });


    this.bkg = this.mainGroup.append("rect")
        .attr('y',0) //20)
        .attr('width', self.width  )
        .attr('height',self.height )
        .style("stroke", "none")
        .style("fill", "#792d3e")
        //.style("cursor", "ns-resize")
        ;

    this.rect = this.mainGroup.append("rect")
        .attr('width', self.width  )
        .attr('height',self.height*0.5 )
        .style("stroke", "none")
        .style("fill", "#e3e3e3")
        ;

    this.text = this.mainGroup.append("text")
        .attr("x",self.width-2)
        .attr("dy", "-2px")
        .attr("text-anchor", "end")
        .attr("font-family","sans-serif")
        .attr("font-size","12")
        .attr("contentEditable", true)
        .style("fill", "#792d3e")
        .text("0")
};
DUI.Slider_V.prototype = Object.create(DUI.Widget.prototype);

DUI.Slider_V.prototype.setRange = function(min,max,val){
    this.scale.range([min,max]);
    if(val!=undefined)this.value = val;
    this.setValue(this.value,false);
    return this;
};
DUI.Slider_V.prototype.setValue = function(v,propagate){
    this.value = v;
    this.hCursor = this.scale.invert(v);
    this.rect.attr('height',this.hCursor);
    this.text.attr('y',this.hCursor).text(v.toString().slice(0,6));
    if( (this.callback)&&(propagate) ){
        this.callback(v);
    }
    return this;
};


DUI.Rotary = function(svg,params){
    DUI.Widget.call(this,svg,params); //call constructor
    var self = this;
    this.ray = this.width/2 - 4;
    this.cx  = this.x + this.width/2;
    this.cy  = this.y + this.width/2

    this.color  = params.color ? params.color : "#33CC00";
    this.mouseCoef = 2.0;
    this.wheelCoef = 1.0/6.0;
    this.angle = 0;
    this.valueMin = -150;
    this.valueMax =  150;

    this.scale = d3.scale.linear()
        .domain([-150,150]) //angle
        .range([-100,100])  //value
        .clamp(true);

    this.drag = d3.behavior.drag()
        .on("drag",function(d){
            var a = self.angle - (d3.event.dy*self.mouseCoef);
            self.setValue(self.scale(a),true);
        });



    this.mainGroup
        .attr("pointer-events", "all")
        .style("cursor", "ns-resize")
        .call(self.drag)
        .on("wheel.zoom",function() {
            var dx = d3.event.wheelDeltaX;
            var dy = d3.event.wheelDeltaY;
            var d = Math.sqrt((dx*dx)+(dy*dy));
            if( Math.abs(dx)>Math.abs(dy) ){ if(dx>0)d=-d; }
            else{ if(dy<0)d=-d; }
            var a = self.angle - (d * self.wheelCoef);
            //console.log("range:",self.scale.range());
            self.setValue(self.scale(a),true);
        });



    this.bkg =  this.mainGroup.append("circle")
        .attr('cx',self.cx)
        .attr('cy',self.cy)
        .attr('r',self.ray*1.2)
        .style("stroke-dasharray","1,10")
        .style("stroke","#A0A0A0") // "black")
        //.style("fill", "#FCFCFC") //this.color)
        .style("fill", "none") //this.color)
        ;//.style("cursor", "ns-resize");

    this.arc = d3.svg.arc()
        .innerRadius(this.ray*0.5)
        .outerRadius(this.ray)
        .startAngle(this.valueMin*Math.PI/180)
        .endAngle(this.valueMax*Math.PI/180);

    this.face = this.mainGroup.append("path")
        .attr('d',this.arc)
        .attr("fill",this.color)
        .attr("transform","translate("+self.cx+","+self.cy+")");

    this.cursor = this.mainGroup.append("line")
        .attr('x1',self.cx)
        .attr('y1',self.cy)
        .attr('x2',self.cx)
        .attr('y2',0)
        .style("stroke", "black")
        .style("stroke-width", 6)
        .style("stroke-linecap","round");

    this.needle = this.mainGroup.append("line")
        .attr('x1',self.cx)
        .attr('y1',self.cy-self.ray*0.5)
        .attr('x2',self.cx)
        .attr('y2',self.cy-self.ray)
        .style("stroke", "yellow")
        .style("stroke-width", 2)
    /*DB
    this.text = this.mainGroup.append("text")
        .attr("x",self.cx)
        .attr("y",self.cy+self.ray+10)
        .attr("dy", "5px")
        .attr("contentEditable", true)
        .attr("font-family","sans-serif")
        .attr("text-anchor", "middle")
        .attr("font-size","16")
        .style("fill","black") // this.color)
        .text("0")
        .on("click",function(d){
            console.log("click");
        })
        .on("keyup",function(d){
            console.log("key");
        })
        ;
    */

    this.setValue(0);
    this.setNeedle(0);

};
DUI.Rotary.prototype = Object.create(DUI.Widget.prototype); //construct base

DUI.Rotary.prototype.show = function(onoff){
    if(onoff)$(this.svg).show();
    else $(this.svg).hide();
};

/*
DUI.Rotary.prototype.setNeedle = function(v) {
    if(v<this.valueMin){v=this.valueMin;}
    if(v>this.valueMax){v=this.valueMax;}
    var a = this.scale.invert(v);
    var rad = a*Math.PI/180;
    var x = Math.sin(rad)*this.ray;
    var y = Math.cos(rad)*this.ray;
    this.needle
        .attr("x1",this.cx+x*0.5)
        .attr("y1",this.cy-y*0.5)
        .attr("x2",this.cx+x)
        .attr("y2",this.cy-y);
    return this;
};
*/

/**
 *
 * @param a angle en degrés
 * @returns {DUI.Rotary}
 */
DUI.Rotary.prototype.setNeedle = function(a) {
    var rad = a*Math.PI/180;
    var x = Math.sin(rad)*this.ray;
    var y = Math.cos(rad)*this.ray;
    this.needle
        .attr("x1",this.cx+x*0.5)
        .attr("y1",this.cy-y*0.5)
        .attr("x2",this.cx+x)
        .attr("y2",this.cy-y);
    return this;
};

DUI.Rotary.prototype.setValue = function(v,propagate) {
    //console.log("Rotary.setValue:",v,propagate);
    if(v<this.valueMin){v=this.valueMin;}
    if(v>this.valueMax){v=this.valueMax;}
    var a = this.scale.invert(v);
    this.value = v;
    this.angle = a;
    var rad = a*Math.PI/180;

    this.cursor
        .attr("x2",this.cx+Math.sin(rad)*this.ray)
        .attr("y2",this.cy-Math.cos(rad)*this.ray);
    //DB this.text.text( this.value.toFixed(1) );

    if( (this.callback)&&(propagate) ){
        this.callback( v,this );
    }
    return this;
}
DUI.Rotary.prototype.setNormValue = function(v,propagate){
    var v = this.valueMin + v*(this.valueMax-this.valueMin);
    this.setValue(v,propagate);
}

DUI.Rotary.prototype.setValueMin = function(a){
    this.setMinMax(a,this.valueMax);
}

DUI.Rotary.prototype.setValueMax = function(a){
    this.setMinMax(this.valueMin,a);
}


DUI.Rotary.prototype.setMinMax = function(min,max) {
    if(min!=undefined)this.valueMin = min;
    if(max!=undefined)this.valueMax = max;
    /*
    console.log("rot-range:", this.scale.range());
    console.log("rot-domain:", this.scale.domain());
    console.log(" valueMin:",this.valueMin,"->",this.scale.invert(this.valueMin));
    console.log(" valueMax:",this.valueMax,"->",this.scale.invert(this.valueMax));
    */
    //console.log(this.scale.invert(this.valueMin)*Math.PI/180);
    //console.log(this.scale.invert(this.valueMax)*Math.PI/180);

    this.arc
        .startAngle(this.scale.invert(this.valueMin)*Math.PI/180)
        .endAngle(  this.scale.invert(this.valueMax)*Math.PI/180);
    this.face.attr("d",this.arc);
    this.setValue(this.value,false);
    return this;
};

DUI.Rotary.prototype.setRange = function(min,max,val) {
    var rng = this.scale.range();
    if(min!=undefined)rng[0]=min;
    if(max!=undefined)rng[1]=max;
    this.scale.range(rng);
    if(val!=undefined)this.value = val;
    this.setValue(this.value,false);
    return this;
};

DUI.Rotary.prototype.setDomain = function(min,max) {
    var dm = this.scale.domain();
    if(min!=undefined)dm[0]=min;
    if(max!=undefined)dm[1]=max;
    this.scale.domain(dm);
    this.setValue(this.value,false);
    return this;
};



