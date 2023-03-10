import Token from "../lexer/token";
import { PositionRange, p } from "../classes/position";

export class ASTNode {
    type = "node";
    range?: PositionRange;

    setPos (range?: PositionRange) {
        this.range = range;
        return this;
    }
}
export class QueryNode extends ASTNode {
    type = "query";
    commands: CommandNode[];

    constructor (commands: CommandNode[]) {
        super();
        this.commands = commands;
        this.setPos(p(
            commands[0].range?.start!, 
            commands[commands.length - 1].range?.end, 
            commands[0].range?.text
        ));
    }

    toString () {
        return `[EVERY:\n\n${this.commands.join("\n")}\n\n]`;
    }
}

export abstract class CommandNode extends ASTNode {
    type = "command";
}

export class RelativeCommandNode extends CommandNode {
    type = "relativeCommand";
    quantity?: NumberNode;
    unit: UnitNode;

    constructor (arg1: NumberNode|UnitNode, arg2?: UnitNode) {
        super();
        if (arg1 instanceof NumberNode) {
            this.quantity = arg1;
            this.unit = arg2!;
        } else {
            this.unit = arg1;
        }
        this.setPos(p(
            this.quantity?.range?.start ?? this.unit.range?.start!,
            this.unit.range?.end,
            this.unit.range?.text
        ));
    }

    toString () {
        if (this.quantity) return `[RELATIVE: ${this.quantity} ${this.unit}]`;
        return `[RELATIVE: ${this.unit}]`;
    }
}

export class AbsoluteCommandNode extends CommandNode {
    type = "absoluteCommand";
    dayOfWeek?: DayOfWeekNode;
    date?: DateNode;
    month?: MonthNode;

    constructor (arg1: DayOfWeekNode|DateNode|MonthNode, arg2?: DateNode) {
        super();
        if (arg1 instanceof DayOfWeekNode)  this.dayOfWeek = arg1;
        else if (arg1 instanceof DateNode)  this.date = arg1;
        else if (arg1 instanceof MonthNode) {
            this.month = arg1;
            this.date = arg2!;
        }

        let targetNode = this.dayOfWeek ?? this.date ?? this.month;
        this.setPos(p(
            targetNode?.range?.start!,
            targetNode?.range?.end,
            targetNode?.range?.text
        ));
    }

    toString () {
        if (this.dayOfWeek) return `[ABSOLUTE: ${this.dayOfWeek}]`;
        if (this.month) return `[ABSOLUTE: ${this.month} ${this.date}]`; 
        return `[ABSOLUTE: ${this.date}]`;
       
    }
}

export class JsCommandNode extends CommandNode {
    type = "jsCommand";
    code: Token;

    constructor (_keyword: any, code: Token) {
        super();
        this.code = code;
        this.setPos(p(
            code.range?.start!,
            code.range?.end,
            code.range?.text
        ));
    }

    toString () {
        return `[JSCODE: ${this.code.value}]`;
    }
}

export class NumberNode extends ASTNode {
    type = "number";
    value: Token;

    constructor (value: Token) {
        super();
        this.value = value;
        this.setPos(p(
            value.range?.start!,
            value.range?.end,
            value.range?.text
        ));
    }

    toString () {
        return this.value.value;
    }
}


export class UnitNode extends ASTNode {
    type = "unit";
    value: Token;

    constructor (value: Token) {
        super();
        this.value = value;
        this.setPos(p(
            value.range?.start!,
            value.range?.end,
            value.range?.text
        ));
    }

    toString () {
        return this.value.value;
    }
}

export class DayOfWeekNode extends ASTNode {
    type = "dayOfWeek";
    value: Token;

    constructor (value: Token) {
        super();
        this.value = value;
        this.setPos(p(
            value.range?.start!,
            value.range?.end,
            value.range?.text
        ));
    }

    toString () {
        return this.value.value;
    }
}

export class DateNode extends ASTNode {
    type = "date";
    value: Token;

    constructor (value: Token) {
        super();
        this.value = value;
        this.setPos(p(
            value.range?.start!,
            value.range?.end,
            value.range?.text
        ));
    }

    toString () {
        return this.value.value + 'th';
    }
}

export class MonthNode extends ASTNode {
    type = "month";
    value: Token;

    constructor (value: Token) {
        super();
        this.value = value;
        this.setPos(p(
            value.range?.start!,
            value.range?.end,
            value.range?.text
        ));
    }

    toString () {
        return this.value.value;
    }
}