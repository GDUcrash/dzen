import Token from "./token";
import Error from "../classes/error";
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

export type LexerPartResult = Token[]|Error;
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

            if (comment) this.stripComment(comment);
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
                if (res instanceof Error) return res;
            }

            // if start of js code
            else if (next3 == JS_BEGIN) {
                advanceBy3();
                const res = this.makeToken(tokens, this.makeJsCode, char);
                if (res instanceof Error) return res;
            }

            // if word
            else if (isWord(char)) {
                const res = this.makeToken(tokens, this.makeWord, char);
                if (res instanceof Error) return res;
            }

            // if symbol
            else if (hasSymbolsStartWith(char)) {
                const res = this.makeToken(tokens, this.makeSymbol, char);
                if (res instanceof Error) return res;
            }

            // if unknown
            else {
                return Error.syntax('Unexpected character ' + char, p(this.current.pos, this.text));
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
        let ps = this.current.pos.clone();

        while (this.current.char && isWord(this.current.char)) {
            let char = this.current.char;
            w += char;
            this.next();
        }

        this.prev();
        let pe = this.current.pos.clone();

        if(isKeyword(w))
            return new Token(TOKEN_KEYWORD, w);
        else
            return Error.syntax('Unexpected word ' + w, p(ps, pe, this.text));
    }

    protected makeNumber = () => {
        let nString = '';
        let ps = this.current.pos.clone();

        while (this.current.char && isNumeric(this.current.char)) {
            let char = this.current.char;
            nString += char;
            this.next();
        }

        let n = Number(nString);
        let token: Token;

        const [ suffix, advance ] = this.selectNext(2);

        if (NUMERIC_SUFFIXES.includes(suffix)) {
            token = new Token(TOKEN_DATE, n);
            advance();
        } else {
            token = new Token(TOKEN_NUMBER, n);
        }

        this.prev();
        let pe = this.current.pos.clone();
        return token;
    }

    protected makeJsCode = () => {
        let js = '';
        let ps = this.current.pos.clone();

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
        let pe = this.current.pos.clone();

        if(next3 != JS_END)
            return Error.syntax('Unexpected end of file', p(ps, this.current.pos.prev(), this.text));
           
        advanceBy3();
        return new Token(TOKEN_JSCODE, js);
    }

    protected makeSymbol = () => {
        let s = '';
        let ps = this.current.pos.clone();

        while (this.current.char && hasSymbolsStartWith(s)) {
            let char = this.current.char;
            s += char;
            this.next();
        }

        this.prev();
        let pe = this.current.pos.clone();
        s = s.slice(0, -1);
        if (isSymbol(s))
            return new Token(SYMBOLS[s]);
        else
            return Error.syntax('Unexpected token ' + s, p(ps, pe, this.text));
    }

    protected stripComment = (end: any) => {
        // advance until found a matching comment end symbol or reached the end
        while (this.current.char && !isCommentEnd(this.text, this.current.pos.index, end)) {
            this.next(this.text);
        }

        // if the end symbol is a new line, don't strip it
        if (this.current.char == '\n') return;
        // otherwise do
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