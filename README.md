# A query language for describing repeating task intervals
Yeah.. don't know how to describe it better. The language executes your query and returns the closest future date (rounded down to day) that matches. Think of it as a cron for humans.

## Syntax examples
```c
// "every" keyword in the beginning can be omitted
// plural and singular variations of the time unit keywords are interchangable (ex. day/days, week/weeks, month/months)
// "st", "nd", "rd" and "th" suffixes on the end of dates are required, but are interchangable
// "everyday" and "daily" are shorthands for "every day"
// "weekly" is a shorthand for "every week"
// "monthly" is a shorthand for "every month"
// "yearly" and "annually" are shorthands for "every year"
// oh, and also this thing is completely case-insensitive


// relative commands (add days to the "now")

every day     // now + 1d
every 2 days  // now + 2d
every week    // now + 7d
every month   // now + 1m
every year    // now + 1y
every 5 years // now + 5y

// absolute commands (pick a nearest future date from the "now", that matches a certain query)

every sunday
every monday, tuesday, wednesday

every 8th
every 1st, 10th, 16th

every 32nd // error
every 8th, 10th, 32nd // error

every february 8th
every 1st, january 2nd, january 3rd, february 11th, march 21st

// execute arbitrary functions to calculate task offset in days
// (unsafe JavaScript code execution, this feature is turned off by default but can be enabled in settings for more advanced queries)

every f{:: (now) => Math.random() * 10 ::}
```

## Usage
```
npm install dzen
```

```js
import Dzen from "./classes/dzen";
import DzenError from "./classes/error";

const text = "every 5 days";

const dzen = new Dzen({
    now: new Date(), // can be any date object
    settings: {
        allowUnsafeCodeExecution: false // turn on to allow executing arbitrary JavaScript functions in queries
    }
});

const result = dzen.runLine(text); // you can also use dzen.runBlock(text) to run multiple queires at once

if (result instanceof DzenError) {
    console.log(result.toString());
} else {
    console.log(result.toLocaleDateString());
}
```