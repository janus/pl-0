
import {tmest} from "./test";

import {Token, Sym, getSymForKeyword, operatorSymbol} from "./type";


let spaceSymbol = [" ", "\t", "\n", "\r"];


export function tokenize(source: string) {
    const tokens: Token[] = [];
    let len = source.length;
    let sym: Sym;
    let index = 0;
    let numStr: string;
    let num: number;
    let str: string;
    let startSym: string;
    let strAcc: string;
    let dots: string;
    while(index < len) {
        if(spaceSymbol.includes(source[index])) {
            index++;
            while(spaceSymbol.includes(source[index])) {
                index++;
            }
            continue; 
        } 
        if(isAlphabet(source[index])) {
            strAcc = source[index];
            index++;
            while(index < len && isAlphNum(source[index])) {
                strAcc += source[index];
                index++;
            }

            sym = getSymForKeyword(strAcc);
            tokens.push({knd: sym, val: strAcc})
 
        } else if(isNumber(source[index])){
            numStr = source[index];
            index++;
            while(index < len && (isNumber(source[index]) || source[index] === ".")) {
                numStr += source[index];
                index++;
            }

            sym = Sym.number;
            num = parseFloat(numStr);
            tokens.push({knd: sym, val: num});
        } else if(source[index] === "'" || source[index] === '"') {
            str  = "";
            startSym = source[index];
            index++;
            while(index < len && startSym !== source[index]) {
                str += source[index];
                index++;
            }
            tokens.push({knd: Sym.string, val: str});
            index++;
        } else if(source[index] === "{") {
            index++;
            while(source[index] !== "}") {
                index++;
            }
            index++;
        } else if(source[index] === ".") {
            dots = source[index];
            index++;
            while(source[index] === ".") {
                dots += source[index];
                index++; 
            }
            tokens.push({knd: Sym.dots, val: dots});
        } else if(source[index] === ":") {
            index++;
            if(index < len && source[index] === "=") {
                tokens.push({knd: Sym.becomes})
                index++;
            } else {
                tokens.push({knd: Sym.nul})
            }
        } else if("+*(=.<[;]>#,)/-".includes(source[index])){
           sym = operatorSymbol[source[index]];
           tokens.push({knd: sym});
           index++;
        } else {
            console.log(source[index])
            throw new Error(`Unexpected token: ${source[index]}`);
        }
    }
    return tokens;
}


const isAlphabet = (chr: String) => chr >= "A" && chr <= "Z" || chr >= "a" && chr <= "z";
const isNumber = (chr: String) => chr >= "0" && chr <= "9";
const isAlphNum = (chr: String) => isAlphabet(chr) || isNumber(chr);

