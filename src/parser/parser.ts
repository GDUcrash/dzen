import { Parser } from "parseit.js";
import grammar from "./grammar";

const parser = new Parser(grammar);

export default parser;