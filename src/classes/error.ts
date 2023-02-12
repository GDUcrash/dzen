import { PositionRange } from "./position";

export default class DzenError {

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

    static syntax (details?: string, range?: PositionRange) {
        return new DzenError('SyntaxError', details, range);
    }

    static runtime (details?: string, range?: PositionRange) {
        return new DzenError('RuntimeError', details, range);
    }

    setPos (range?: PositionRange) {
        this.range = range;
        return this;
    }
    
    toString () {
        return this.constructErrorStr();
    }

    protected constructErrorStr () {
        let s = this.type;
        if (this.range) s += ` on line ${this.range.start.line} col ${this.range.start.col}`;

        if (this.details) s += `\n  > ${this.details}`;

        if (this.range) {
            const text = this.range.text?.split('\n')[this.range.start.line-1];
            s += `\n  > ${text}`;

            let underlStart = this.range.start.col-1;
            let underlEnd = this.range.end.col;
            if (this.range.start.line != this.range.end.line) underlEnd = text!.length;

            s += this.underline(4, underlStart, underlEnd)
        }

        return s;
    }

    protected underline (offset: number, from: number, to: number) {
        let s = '\n';
        let start = offset + from;

        for (let i = 0; i < start; i++)     s += ' ';
        for (let i = 0; i < to - from; i++) s += '‾';
        return s;
    }

}