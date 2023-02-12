import { PositionRange } from "./position";

export default class Error {

    details?: string;
    range?:   PositionRange;

    type = 'Error';

    constructor (type?: string, details?: string, range?: PositionRange) {
        this.type    = type ?? this.type;
        this.details = details;
        this.range   = range;
        
        if (this.range && this.range.start.col < 1) {
            this.range.start.next();
            this.range.end.next();
        }
    }

    setPos (range?: PositionRange) {
        this.range = range;
        return this;
    }
    
    toString () {
        let result = this.type;
        if (this.details) result += ': ' + this.details;
        return result;
    }

    static syntax (details?: string, range?: PositionRange) {
        return new Error('SyntaxError', details, range);
    }

    static runtime (details?: string, range?: PositionRange) {
        return new Error('RuntimeError', details, range);
    }

}