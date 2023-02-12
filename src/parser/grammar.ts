import { Grammar, either } from "parseit.js";
import { 
    QueryNode, CommandNode,
    RelativeCommandNode, AbsoluteCommandNode, JsCommandNode,
    NumberNode, UnitNode, DayOfWeekNode, DateNode, MonthNode
} from "./ast";

const grammar = new Grammar();

const queryDataFilter = (data: any[]) => {
    data = data.filter(f => f instanceof CommandNode);
    return new QueryNode(data);
}

grammar.rule("query").from("@KEYWORD:every").blockLoop("$command", "@SEP").decide(queryDataFilter);
grammar.rule("query").from("@KEYWORD:every", "$command").decide(queryDataFilter);
grammar.rule("query").blockLoop("$command", "@SEP").decide(queryDataFilter);
grammar.rule("query").from("$command").decide(queryDataFilter);

grammar.rule("command").from("$relativeCommand").pass();
grammar.rule("command").from("$absoluteCommand").pass();

grammar.rule("relativeCommand").from("$number", "$unit").as(RelativeCommandNode);
grammar.rule("relativeCommand").from("$unit").as(RelativeCommandNode);
grammar.rule("relativeCommand").from("@KEYWORD:f", "@JSCODE").as(JsCommandNode);

grammar.rule("absoluteCommand").from("$dayOfWeek").as(AbsoluteCommandNode);
grammar.rule("absoluteCommand").from("$date").as(AbsoluteCommandNode);
grammar.rule("absoluteCommand").from("$month", "$date").as(AbsoluteCommandNode);

grammar.rule("number").from("@NUMBER").as(NumberNode);
grammar.rule("unit").from(either(
    "@KEYWORD:day", "@KEYWORD:days",
    "@KEYWORD:week", "@KEYWORD:weeks",
    "@KEYWORD:month", "@KEYWORD:months",
    "@KEYWORD:year", "@KEYWORD:years"
)).as(UnitNode);
grammar.rule("dayOfWeek").from(either(
    "@KEYWORD:sunday", "@KEYWORD:monday", "@KEYWORD:tuesday", "@KEYWORD:wednesday",
    "@KEYWORD:thursday", "@KEYWORD:friday", "@KEYWORD:saturday"
)).as(DayOfWeekNode);
grammar.rule("date").from("@DATE").as(DateNode);
grammar.rule("month").from(either(
    "@KEYWORD:january", "@KEYWORD:february", "@KEYWORD:march", "@KEYWORD:april",
    "@KEYWORD:may", "@KEYWORD:june", "@KEYWORD:july", "@KEYWORD:august", "@KEYWORD:september",
    "@KEYWORD:october", "@KEYWORD:november", "@KEYWORD:december"
)).as(MonthNode);

grammar.startFrom("query");

export default grammar;