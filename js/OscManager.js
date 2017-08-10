/**
* Created by Cecile on 05/08/17.
*/


const oscMin = require('osc-min'); //TODO: do we need to do it here as well

OscManager = function () {

   this.oscUserReceiver = null; // reads values from user
   this.oscCm9Receiver = null; // reads commands from CM9
   this.oscUserSender = null; // forward sensor values to user
   this.oscCm9Sender = null; //TODO: à parler avec Didier....

};