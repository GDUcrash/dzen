import Token from "./token";
import DzenError from "../classes/error";
import Position, { p } from "../classes/position";
import {
    hasSymbolsStartWith, isComment, isCommentEnd,
    isKeyword, isNumeric, isSymbol, isWord, isWhitespace
} from "./util";
import { 
    SYMBOLS, TOKEN_KEYWORD, TOKEN_NUMBER, TOKEN_JSCODE,
    TOKEN_DATE, NUMERIC_SUFFIXES, JS_BEGIN, JS_END, JS_ESCAPE
} from "./constants";

export type LexerCurrentState = {
    pos: Position;
    char: string|null;
}

export type LexerPartResult = Token[]|DzenError;
export type LexerResult = [ LexerPartResult, string|null ];


export default class Lexer {

    current: LexerCurrentState = {
        pos: new Position(-1, 1, 0),
        char: null,
    };

    text: string;
    textPart?: string;

    constructor (text: string) {
        this.text = text;
        this.next(this.text);
    }

    tokenize (): LexerResult {
        this.rewind(this.text);
        let textStripped = '';

        while (this.current.char) {
            let comment = isComment(this.text, this.current.pos.index);

            if (comment) {
                this.stripComment(comment);
                textStripped += '\n';
            }
            else textStripped += this.current.char ?? "";

            this.next(this.text);
        }

        textStripped += ' ';
        this.textPart = textStripped;

        //tokenize
        this.rewind();
        const result = this.tokenizePart();
        return [result, this.textPart];
    }

    protected tokenizePart (): LexerPartResult {

        const tokens: Token[] = [];

        while (this.current.char) {
            const char = this.current.char;
            const [ next3, advanceBy3 ] = this.selectNext(3);

            // if whitespace
            if (isWhitespace(char))
                this.next();

            // if numeric
            else if (isNumeric(char)) {
                const res = this.makeToken(tokens, this.makeNumber, char);
                if (res instanceof DzenError) return res;
            }

            // if start of js code
            else if (next3 == JS_BEGIN) {
                advanceBy3();
                const res = this.makeToken(tokens, this.makeJsCode, char);
                if (res instanceof DzenError) return res;
            }

            // if word
            else if (isWord(char)) {
                const res = this.makeToken(tokens, this.makeWord, char);
                if (res instanceof DzenError) return res;
            }

            // if symbol
            else if (hasSymbolsStartWith(char)) {
                const res = this.makeToken(tokens, this.makeSymbol, char);
                if (res instanceof DzenError) return res;
            }

            // if unknown
            else {
                return DzenError.syntax('Unexpected character ' + char, p(this.current.pos, this.text));
            }
        }

        return tokens;

    }


    protected makeToken = (tokens: Token[], func: Function, ...args: any) => {
        let t = func(args);
        tokens.push(t);
        this.next();
        return t;
    }

    protected makeWord = () => {
        let w = '';
        const ps = this.current.pos.clone();

        while (this.current.char && isWord(this.current.char)) {
            let char = this.current.char.toLowerCase();
            w += char;
            this.next();
        }

        this.prev();
        const pe = this.current.pos.clone();

        if(isKeyword(w))
            return new Token(TOKEN_KEYWORD, w, p(ps, pe, this.textPart));
        else
            return DzenError.syntax('Unexpected word ' + w, p(ps, pe, this.text));
    }

    protected makeNumber = () => {
        let nString = '';
        const ps = this.current.pos.clone();

        while (this.current.char && isNumeric(this.current.char)) {
            let char = this.current.char;
            nString += char;
            this.next();
        }

        let n = Number(nString);
        let token: Token;

        const [ suffix, advance ] = this.selectNext(2);

        this.prev();
        const pe = this.current.pos.clone();
        const range = p(ps, pe, this.textPart);

        if (NUMERIC_SUFFIXES.includes(suffix.toLowerCase())) {
            token = new Token(TOKEN_DATE, n, range);
            advance();
        } else {
            token = new Token(TOKEN_NUMBER, n, range);
        }

        return token;
    }

    protected makeJsCode = () => {
        let js = '';
        const ps = this.current.pos.clone();

        let [ next3, advanceBy3 ] = this.selectNext(3);
        while (this.current.char && next3 != JS_END) {
            let char = this.current.char;
            if (char == JS_ESCAPE) {
                this.next();
                char = this.current.char;
            }
            js += char;
            this.next();
            [ next3, advanceBy3 ] = this.selectNext(3);
        }

        this.prev();
        const pe = this.current.pos.clone();

        if(next3 != JS_END)
            return DzenError.syntax('Unexpected end of file', p(ps, this.current.pos.prev(), this.text));
           
        advanceBy3();
        return new Token(TOKEN_JSCODE, js, p(ps, pe, this.textPart));
    }

    protected makeSymbol = () => {
        let s = '';
        const ps = this.current.pos.clone();

        while (this.current.char && hasSymbolsStartWith(s)) {
            let char = this.current.char;
            s += char;
            this.next();
        }

        this.prev();
        const pe = this.current.pos.clone();
        s = s.slice(0, -1);
        if (isSymbol(s))
            return new Token(SYMBOLS[s], undefined, p(ps, pe, this.textPart));
        else
            return DzenError.syntax('Unexpected token ' + s, p(ps, pe, this.text));
    }

    protected stripComment = (end: any) => {
        // advance until found a matching comment end symbol or reached the end
        while (this.current.char && !isCommentEnd(this.text, this.current.pos.index, end)) {
            this.next(this.text);
        }

        for (let i = 0; i < end.length; i++) this.next(this.text);

        // back up by one
        this.prev(this.text);
    }


    protected next = (text: string = this.textPart!) => {
        this.current.pos.next(this.current.char);
        this.current.char = text[this.current.pos.index] ?? null;
    }

    protected prev = (text: string = this.textPart!) => {
        this.current.pos.prev();
        this.current.char = text[this.current.pos.index] ?? null;
    }

    protected rewind = (text: string = this.textPart!) => {
        this.current.pos = new Position(-1, 1, 0);
        this.current.char = null;
        this.next(text);
    }

    protected selectNext = (
        amount: number = 1, 
        text: string = this.textPart!
    ): [string, () => void] => {

        let s = this.current.char ?? '';
        for (let i = 1; i < amount; i++)
            s += text[this.current.pos.index+i] ?? '';
        
        return [s, () => {
            for (let i = 0; i < amount; i++) 
                this.next(text);
        }];

    }

}