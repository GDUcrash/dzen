export const WORD = "abcdefghijklmnopqrstuvwxyz";
export const NUMERIC = "0123456789";
export const NUMERIC_SUFFIXES = ["st", "nd", "rd", "th"];

export const TOKEN_SEP     = "SEP";
export const TOKEN_NUMBER  = "NUMBER";
export const TOKEN_DATE    = "DATE";
export const TOKEN_KEYWORD = "KEYWORD";
export const TOKEN_JSCODE  = "JSCODE";

export const SYMBOLS: any = {
    ',': TOKEN_SEP,
}

export const KEYWORDS: any = [
    "every", "everyday", "daily", "weekly", 
    "monthly", "yearly", "annually",

    "day", "days", "week", "weeks", 
    "month", "months", "year", "years",

    "sunday", "monday", "tuesday", "wednesday",
    "thursday", "friday", "saturday",

    "january", "february", "march", "april", 
    "may", "june", "july", "august", "september",
    "october", "november", "december",

    "f"
];

export const JS_BEGIN  = "{::";
export const JS_END    = "::}";
export const JS_ESCAPE = "\\";
export const COMMENT_START = ["//", "#", "/*"];
export const COMMENT_END   = ["\n", "\n", "*/"];