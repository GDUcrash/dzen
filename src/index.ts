import Lexer from "./lexer/lexer";
import parser from "./parser/parser";

import Error from "./classes/error";
import Token from "./lexer/token";

const lexer = new Lexer(`
/* "now" can be task's startRange.start, startRange.end, endRange.start, endRange.end or reminder's date
 "now" is also rounded down to the day and any time more detailed than that will get cut off */

// "every" keyword in the beginning can be omitted
// plural and singular variations of the time unit keywords are interchangable (ex. day/days, week/weeks, month/months)
// "st", "nd", "rd" and "th" suffixes on the end of numbers are required, but are interchangable
// "everyday" and "daily" are shorthands for "every day"
// "weekly" is a shorthand for "every week"
// "monthly" is a shorthand for "every month"
// "yearly" and "annualy" are shorthands for "every year"



// relative commands (add days to the "now")

every day     // now + 1d
every 2 days  // now + 2d
every week    // now + 7d
every month   // now + 1m
every year    // now + 1y
every 5 years // now + 5y

// execute arbitrary functions to calculate task offset in days
// (unsafe JavaScript code execution, this feature is turned off by default but can be enabled in settings for more advanced queries)

every f{:: (now) => Math.random() * 10 ::}



// absolute commands (pick a nearest future date from the "now", that matches a certain query)

every sunday
every monday, tuesday, wednesday

every 8th
every 1st, 10th, 16th

every 32nd // error
every 8th, 10th, 32nd // error

every february 8th
every january 1st, 2nd, february 11th, 12th, march 21st, 22nd
`);

const [ result, text ] = lexer.tokenize();

if (result instanceof Error) {
    console.log(result.toString());
    process.exit(1);
}

// split the result at every "every" keyword
const isEvery = (token: any) => token.type === "KEYWORD" && token.value === "every";
const queries: Token[][] = [];
let currentQuery: Token[] = [];

result.forEach(token => {
    if (isEvery(token)) {
        currentQuery = [];
        queries.push(currentQuery);
    } 
    currentQuery.push(token);
});

console.log(queries);

// parse each query
queries.forEach(query => {
    const result = parser.parse(query);
    console.log(result.toString());
});