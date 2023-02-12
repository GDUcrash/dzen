import { WORD, NUMERIC, KEYWORDS, SYMBOLS, COMMENT_START, COMMENT_END } from "./constants";

export const isWhitespace = (char: string) => char.trim() !== char;
export const isWord       = (char: string) => WORD.includes(char.toLowerCase());
export const isNumeric    = (char: string) => NUMERIC.includes(char);

export const isKeyword = (str: string) => KEYWORDS.includes(str);
export const isSymbol  = (str: string) => SYMBOLS[str];

export const hasSymbolsStartWith = (str: string) => {
    return Object.keys(SYMBOLS).filter(f => f.startsWith(str)).length;
}

export const isComment = (text: string, pos: number) => {
    let comment: boolean|string = false;

    let ci = -1;
    COMMENT_START.forEach(cs => {
        ci++;
        let s = text.slice(pos, pos+cs.length);
        if (s == cs) comment = COMMENT_END[ci];
    });

    return comment;
}

export const isCommentEnd = (text: string, pos: number, end: string) => {
    let s = text.slice(pos, pos+end.length);
    if (s == end) return true;
    return false;
}