
export class Playable {

    constructor(opts) {
        this.title = opts.title;
        this.log = [];
    }

    play() {
        this.log.unshift('Playing: ' + this.title);
        window.console.log('TITLE: ' + this.title);
    }
}

var playable = new Playable({'title': 'House of Cards'});
playable.play();