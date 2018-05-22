/**
 * Created by Didier on 29/04/16.
 */

function Tracks(){

    this.tracks  = [];
    this.recEnab = [];

    this.addTrack = function(){

    }

    this.setRecOnOff = function(idx,onoff){
        this.recEnab[idx]=onoff;
    }
    this.getRecOnOff = function(idx){
        return this.recEnab[idx];
    }



};//Tracks()


function track(){

};
