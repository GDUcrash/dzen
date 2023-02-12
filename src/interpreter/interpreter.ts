import { 
    ASTNode, QueryNode,
    RelativeCommandNode, AbsoluteCommandNode, JsCommandNode,
    NumberNode, UnitNode, DayOfWeekNode, DateNode, MonthNode
} from "../parser/ast";
import { 
    roundDownToDay,
    getNearestWeekday, getNearestDate, getNearestMonthDate,
    isDayKeyword, isWeekKeyword, isMonthKeyword, isYearKeyword,
} from "./util";
import {
    UNIT_DAY, UNIT_WEEK, UNIT_MONTH, UNIT_YEAR, MONTHS, DayOfWeek
} from "./constants";
import DzenError from "../classes/error";

export type InterpreterContext = {
    now: Date;
    settings: {
        allowUnsafeCodeExecution: boolean;
    }
}

export type InterpreterResult = Date|DzenError;

export default class Interpreter {

    context: InterpreterContext = {
        now: new Date(),
        settings: {
            allowUnsafeCodeExecution: false
        },
    }

    constructor (context?: InterpreterContext) {
        if (context) this.context = context;
    }

    setContext (context: Partial<InterpreterContext>) {
        this.context = { ...this.context, ...context };
    }

    interpret (ast: ASTNode): InterpreterResult {
        return this.pass(ast) as InterpreterResult;
    }

    pass (ast: ASTNode) {
        const nodeType = ast.type;
        let res: any;

        switch (nodeType) {
            case 'query': res = this.passQuery(ast as QueryNode); break;
            case 'relativeCommand': res = this.passRelativeCommand(ast as RelativeCommandNode); break;
            case 'absoluteCommand': res = this.passAbsoluteCommand(ast as AbsoluteCommandNode); break;
            case 'jsCommand': res = this.passJsCommand(ast as JsCommandNode); break;
            case 'number': res = this.passNumber(ast as NumberNode); break;
            case 'unit': res = this.passUnit(ast as UnitNode); break;
            case 'dayOfWeek': res = this.passDayOfWeek(ast as DayOfWeekNode); break;
            case 'date': res = this.passDate(ast as DateNode); break;
            case 'month': res = this.passMonth(ast as MonthNode); break;
            default: DzenError.runtime(`Unknown node type: ${nodeType}`, ast.range);
        }

        return res!;
    }

    passQuery = (node: QueryNode) => {
        let res: any;

        for (const command of node.commands) {
            let newRes = this.pass(command);
            if (newRes instanceof DzenError) return newRes;
            if (!res || newRes < res) res = newRes;
        }

        return res!;
    }

    passRelativeCommand = (node: RelativeCommandNode) => {
        const now = roundDownToDay(this.context.now);
        const quantity = node.quantity ? (this.pass(node.quantity) as number|DzenError) : 1;
        const unit = this.pass(node.unit) as string|DzenError;

        if (quantity instanceof DzenError) return quantity;
        if (unit instanceof DzenError) return unit;

        if (unit === UNIT_DAY) {
            now.setDate(now.getDate() + quantity);
        } else if (unit === UNIT_WEEK) {
            now.setDate(now.getDate() + quantity * 7);
        } else if (unit === UNIT_MONTH) {
            now.setMonth(now.getMonth() + quantity);
        } else if (unit === UNIT_YEAR) {
            now.setFullYear(now.getFullYear() + quantity);
        } else {
            return DzenError.runtime(`Unknown unit: ${unit}`, node.range);
        }

        return now;
    }

    passAbsoluteCommand = (node: AbsoluteCommandNode) => {
        const now = roundDownToDay(this.context.now);
        const dayOfWeek = node.dayOfWeek ? (this.pass(node.dayOfWeek) as DayOfWeek|DzenError) : undefined;
        const date = node.date ? (this.pass(node.date) as number|DzenError) : undefined;
        const month = node.month ? (this.pass(node.month) as number|DzenError) : undefined;

        if (dayOfWeek instanceof DzenError) return dayOfWeek;
        if (date instanceof DzenError) return date;
        if (month instanceof DzenError) return month;

        let newDate: Date;
        if (dayOfWeek) {
            newDate = getNearestWeekday(now, dayOfWeek);
        } else if (month && date) {
            try {
                newDate = getNearestMonthDate(now, month, date);
            } catch (e) {
                return DzenError.runtime('Invalid day of month. The date should be between 1 and the number of days in the month', node.range);
            }    
        } else if (date) {
            try {
                newDate = getNearestDate(now, date);
            } catch (e) {
                return DzenError.runtime('Invalid day of month. The date should be between 1 and 31', node.range);
            }
        } else {
            return DzenError.runtime(`Unknown absolute command: ${node}`, node.range);
        }

        return newDate;
    }

    passJsCommand = (node: JsCommandNode) => {
        if (!this.context.settings.allowUnsafeCodeExecution) 
            return DzenError.runtime('Unsafe code execution is not allowed. If you want to allow it, you can do so in the context\'s settings.', node.range);
        else {
            const code = node.code.value;
            let resFunc: any;
            try {
                resFunc = eval(code);
            } catch (e) {
                return DzenError.runtime(`DzenError while executing JS code: ${e}`, node.range);
            }
            if (typeof resFunc !== 'function') return DzenError.runtime('JS code must return a function');

            const res = resFunc(this.context.now);
            if (typeof res !== 'number' || isNaN(res)) return DzenError.runtime('JS code must return a number of days', node.range);
            if (res < 1 || res > 9999) return DzenError.runtime('JS code must return a number of days between 1 and 9999', node.range);

            const now = roundDownToDay(this.context.now);
            const addDays = Math.floor(res);
            now.setDate(now.getDate() + addDays);
            return now;
        }
    }

    passNumber = (node: NumberNode) => {
        return node.value.value;
    }

    passUnit = (node: UnitNode) => {
        const val = node.value.value;
        if (isDayKeyword(val))   return UNIT_DAY;
        if (isWeekKeyword(val))  return UNIT_WEEK;
        if (isMonthKeyword(val)) return UNIT_MONTH;
        if (isYearKeyword(val))  return UNIT_YEAR;
        return DzenError.runtime(`Unknown unit: ${val}`, node.range);
    }

    passDayOfWeek = (node: DayOfWeekNode) => {
        return node.value.value;
    }

    passDate = (node: DateNode) => {
        return node.value.value;
    }

    passMonth = (node: MonthNode) => {
        return MONTHS.indexOf(node.value.value);
    }

}