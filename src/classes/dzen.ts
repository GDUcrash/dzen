import Lexer from "../lexer/lexer";
import parser from "../parser/parser";
import Interpreter, { InterpreterContext, InterpreterResult } from "../interpreter/interpreter";

import DzenError from "../classes/error";
import Token from "../lexer/token";
import { ASTNode } from "../parser/ast";
import { ParseError } from "parseit.js";

export default class Dzen {

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

    isEvery = (token: any) => (
        token.type === "KEYWORD" && 
        ['every', 'everyday', 'daily', 'weekly', 'monthly', 'yearly', 'annually'].includes(token.value)
    );

    transformParseError (error: ParseError): DzenError {
        return DzenError.syntax(
            `Unexpected token "${ error.position.token?.value ?? error.position.token?.type}"`,
            (error.position.token as any)?.range
        );
    }

    runLine (input: string): Date|DzenError {
        const lexer = new Lexer(input);
        const [ result, text ] = lexer.tokenize();

        if (result instanceof DzenError) {
            return result;
        }

        const ast = parser.parse(result);
        if (ast instanceof ParseError) {
            return this.transformParseError(ast);
        }

        const interpreter = new Interpreter(this.context);
        const res = interpreter.interpret(ast);
        if (res instanceof DzenError) {
            return res;
        }

        return res;
    }

    runBlock (input: string): InterpreterResult[]|DzenError {
        const lexer = new Lexer(input);
        const [ result, text ] = lexer.tokenize();

        if (result instanceof DzenError) {
            return result;
        }

        // split the result at every "every" keyword
        const queries: Token[][] = [];
        let currentQuery: Token[] = [];

        result.forEach(token => {
            if (this.isEvery(token)) {
                currentQuery = [];
                queries.push(currentQuery);
            } 
            currentQuery.push(token);
        });

        // parse each query
        const asts: ASTNode[] = [];
        queries.forEach(query => {
            const result = parser.parse(query);
            if (result instanceof ParseError) {
                return this.transformParseError(result);
            }
            else asts.push(result);
        });

        // execute each query
        const interpreter = new Interpreter(this.context);
        const res: InterpreterResult[] = [];

        asts.forEach(ast => {
            const result = interpreter.interpret(ast);
            res.push(result);
        });

        return res;
    }

}