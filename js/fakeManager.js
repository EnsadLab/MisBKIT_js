class FakeManager {
    constructor() {
        //this.name = "AnimManager"; //Didier? unifié ac les autres, non?  Oui, et c'est moins lourd que className
        this.className = "fakeManager";
        this.ctrlStopAll = -111;
    }
    init(){
        this.ctrlStopAll = 0;
    }

}
module.exports = new FakeManager();
