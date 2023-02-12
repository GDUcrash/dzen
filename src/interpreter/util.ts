import { DayOfWeek, DAYS_OF_WEEK } from "./constants";

const monthsDays = {
    31: [0, 2, 4, 6, 7, 9, 11],
    30: [3, 5, 8, 10],
    29: [1]
}


export const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();


export const roundDownToDay = (date: Date) => {
    const newDate = new Date(date.getTime());
    newDate.setHours(0, 0, 0, 0);
    return newDate;
}

export const getNearestWeekday = (now: Date, weekday: DayOfWeek) => {
    const today = now.getDay();
    const targetDay = DAYS_OF_WEEK.indexOf(weekday);
    const newDate = roundDownToDay(now);
    
    if (today === targetDay) {
        newDate.setDate(newDate.getDate() + 7);
    } else if (today < targetDay) {
        newDate.setDate(newDate.getDate() + (targetDay - today));
    } else {
        newDate.setDate(newDate.getDate() + (7 - today + targetDay));
    }
    
    return newDate;
}

export const getNearestDate = (now: Date, dayOfMonth: number) => {

    if (dayOfMonth < 1 || dayOfMonth > 31) {
        throw new Error('Invalid day of month');
    }

    let currentMonth = now.getMonth();
    let currentDate = now.getDate();

    if (currentDate >= dayOfMonth)
        currentMonth++;

    let daysInMonth = getDaysInMonth(now);

    while (dayOfMonth > daysInMonth) {
        currentMonth++;
        daysInMonth = getDaysInMonth(new Date(now.getFullYear(), currentMonth, 1));
    }

    const newDate = roundDownToDay(new Date(now.getFullYear(), currentMonth, dayOfMonth));
    return newDate;

}

export const getNearestMonthDate = (now: Date, month: number, dayOfMonth: number) => {

    let numberOfDays: number;
    if (monthsDays[31].includes(month)) numberOfDays = 31;
    else if (monthsDays[30].includes(month)) numberOfDays = 30;
    else if (monthsDays[29].includes(month)) numberOfDays = 29;
    else throw new Error('Invalid month');

    if (dayOfMonth < 1 || dayOfMonth > numberOfDays) {
        throw new Error('Invalid day of month');
    }

    let currentMonth = now.getMonth();
    let currentDate = now.getDate();

    if (currentMonth > month || (currentMonth === month && currentDate >= dayOfMonth))
        currentMonth += 12;

    let daysInMonth = getDaysInMonth(now);

    while (dayOfMonth > daysInMonth) {
        currentMonth++;
        daysInMonth = getDaysInMonth(new Date(now.getFullYear(), currentMonth, 1));
    }

    const newDate = roundDownToDay(new Date(now.getFullYear(), currentMonth, dayOfMonth));
    return newDate;

}

export const isDayKeyword   = (word: string) => ['day', 'days'].includes(word);
export const isWeekKeyword  = (word: string) => ['week', 'weeks'].includes(word);
export const isMonthKeyword = (word: string) => ['month', 'months'].includes(word);
export const isYearKeyword  = (word: string) => ['year', 'years'].includes(word);