import { 
    ASTNode, QueryNode, CommandNode,
    RelativeCommandNode, AbsoluteCommandNode, JsCommandNode,
    NumberNode, UnitNode, DayOfWeekNode, DateNode, MonthNode
} from "../parser/ast";
import { 
    roundDownToDay, daysOfWeek, months, DayOfWeek,
    getNearestWeekday, getNearestDate, getNearestMonthDate,
    isDayKeyword, isWeekKeyword, isMonthKeyword, isYearKeyword,
} from "./util";
import {
    UNIT_DAY, UNIT_WEEK, UNIT_MONTH, UNIT_YEAR,
} from "./constants";
import Error from "../classes/error";

export type InterpreterContext = {
    now: Date;
    settings: {
        allowUnsafeCodeExecution: boolean;
    }
}

export type InterpreterResult = Date|Error;

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
            default: Error.runtime(`Unknown node type: ${nodeType}`);
        }

        return res!;
    }

    passQuery = (node: QueryNode) => {
        let res: any;

        for (const command of node.commands) {
            let newRes = this.pass(command);
            if (newRes instanceof Error) return newRes;
            if (!res || newRes < res) res = newRes;
        }

        return res!;
    }

    passRelativeCommand = (node: RelativeCommandNode) => {
        const now = roundDownToDay(this.context.now);
        const quantity = node.quantity ? (this.pass(node.quantity) as number|Error) : 1;
        const unit = this.pass(node.unit) as string|Error;

        if (quantity instanceof Error) return quantity;
        if (unit instanceof Error) return unit;

        if (unit === UNIT_DAY) {
            now.setDate(now.getDate() + quantity);
        } else if (unit === UNIT_WEEK) {
            now.setDate(now.getDate() + quantity * 7);
        } else if (unit === UNIT_MONTH) {
            now.setMonth(now.getMonth() + quantity);
        } else if (unit === UNIT_YEAR) {
            now.setFullYear(now.getFullYear() + quantity);
        } else {
            return Error.runtime(`Unknown unit: ${unit}`);
        }

        return now;
    }

    passAbsoluteCommand = (node: AbsoluteCommandNode) => {
        const now = roundDownToDay(this.context.now);
        const dayOfWeek = node.dayOfWeek ? (this.pass(node.dayOfWeek) as DayOfWeek|Error) : undefined;
        const date = node.date ? (this.pass(node.date) as number|Error) : undefined;
        const month = node.month ? (this.pass(node.month) as number|Error) : undefined;

        if (dayOfWeek instanceof Error) return dayOfWeek;
        if (date instanceof Error) return date;
        if (month instanceof Error) return month;

        let newDate: Date;
        if (dayOfWeek) {
            newDate = getNearestWeekday(now, dayOfWeek);
        } else if (date) {
            newDate = getNearestDate(now, date);
        } else if (month && date) {
            newDate = getNearestMonthDate(now, month, date);
        } else {
            return Error.runtime(`Unknown absolute command: ${node}`);
        }

        return newDate;
    }

    passJsCommand = (node: JsCommandNode) => {
        if (!this.context.settings.allowUnsafeCodeExecution) 
            return Error.runtime('Unsafe code execution is not allowed. If you want to allow it, you can do so in the context\'s settings.');
        else {
            // TODO: Implement this
            return new Date();
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
        return Error.runtime(`Unknown unit: ${val}`);
    }

    passDayOfWeek = (node: DayOfWeekNode) => {
        return node.value.value;
    }

    passDate = (node: DateNode) => {
        return node.value.value;
    }

    passMonth = (node: MonthNode) => {
        return node.value.value;
    }

}