import { Table, Token, Statement, Sym, Fct, CXMAX, Code, STATBEGSYS, DECLBEGSYS, FACBEGSYS, ParseReturns } from "./type";


let dx = 0; // memory location index;
let cx: number = 0;    //code allocation index;
let err: number = 0; //error tracking number
let cx0: number = 0;
let index: number = 0;


const error = (n: number) => {
    console.error(`*** Error <number::${n}>`);
    err++;
}

const test = (tokens: Token[], s1: Sym[], s2: Sym[], n: number) => {
    if(index < tokens.length && !s1.includes(tokens[index].knd)) {
        error(n);
        let ss1 = s1.concat(s2);
        while(!ss1.includes(tokens[index].knd)) index++;

    }
}

const position = (table: Table[], identifier: string) => {
    let idx = 0;
    let len = table.length;
    while(idx < len) {
        if(table[idx].name === identifier) {
            return idx;
        }
        idx++;
    }
    return -1;
}

const match = (token: Token, knd: Sym) => {
    if (token.knd !== knd) {
        return false;
    }
    return true
}

const expectedIdent = (token: Token) => {
    if (!match(token, Sym.ident)) {
        console.log(`Token mismatch: expected identifier but found something else`);
        error(20);
        false;
    }
    return true;
}

const expectedEql = (token: Token) => {
    if (!match(token, Sym.eql)) {
        console.log(`Token mismatch: expected '=' but found something else`);
        error(21);
        return false
    }
    return true;
}

const expectedSemicolon = (token: Token) => {
    if (!match(token, Sym.semicolon)) {
        console.log(`Token mismatch: expected ';' but found something else`);
        error(22);
        return false;
    }
    return true;
}

const matchNum = (token: Token) => {
    if (match(token, Sym.number)) {
        return token.val as number;
    }
    return false;
}

const constDeclaration = (len: number, table: Table[], tokens: Token[]) => {
    if (index < len && expectedIdent(tokens[index])) {
        let identifier = tokens[index].val as string;
        index++;
        if (index < len && expectedEql(tokens[index])) {
            index++;
            let matchResult = matchNum(tokens[index]);
            if (matchResult) {
                let val = matchResult;
                table.push({ name: identifier, knd: "CONSTANT", val: val });
            } else {
                console.log(`Token mismatch: expected number type  but found ${tokens[index].val}`);
                error(24);
            }
        }
    }
}


const varDeclaration = (len: number, table: Table[], tokens: Token[], level: number) => {
    if (expectedIdent(tokens[index])) {
        let identifier = tokens[index].val as string;
        index++;
        table.push({ name: identifier, knd: "VARIABLE", adr: dx, level: level });
        dx++;
    }
}

const proDeclaration = (len: number, table: Table[], tokens: Token[], level: number) => {
    if (expectedIdent(tokens[index])) {
        let identifier = tokens[index].val as string;
        table.push({ name: identifier, knd: "PROC", level: level });
        index++;
    }
}

const gen = (code: Code[], opCode: Fct, y: number, z: number) => {
    if (code.length > CXMAX) {
        throw new Error(" program too long");
    }
    code.push({f: opCode, l: y, a: z })
}

const factor = (level: number, tokens: Token[], code: Code[], table: Table[], setOfSym: Sym[]) => {
    let i: number;
    test(tokens, FACBEGSYS, setOfSym, 24);
    while(FACBEGSYS.includes(tokens[index].knd)) {
        if(Sym.ident === tokens[index].knd) {
            i = position(table, tokens[index].val as string);
            if (i === -1) {
                error(11);
            } else {
                switch(table[i].knd) {
                    case "CONSTANT":
                        gen(code , Fct.lit, 0, table[i].val as number);
                    case "VARIABLE":
                        gen(code, Fct.lod, level - table[i].level as number, table[i].adr as number);
                    case "PROC":
                        error(21);
                }
                index++;
            }
        } else if(Sym.number === tokens[index].knd) {
            gen(code, Fct.lit, 0, tokens[index].val as number);
            index++;
        } else if(Sym.lparen === tokens[index].knd) {
            index++;
            expression(level, tokens, code, table, setOfSym.concat([Sym.rparen]));
            if(Sym.rparen === tokens[index].knd) {
                index++;
            } else error(22);
        }
        test(tokens, setOfSym, [Sym.lparen], 23)
    }
}

const term = (level: number, tokens: Token[], code: Code[], table: Table[], setOfSym: Sym[]) => {
    let mulop;
    factor(level, tokens, code, table, setOfSym.concat([Sym.times, Sym.slash]));
    while([Sym.times, Sym.slash].includes(tokens[index].knd)) {
        mulop = tokens[index].knd;
        index++;
        factor(level, tokens, code, table,setOfSym.concat([Sym.times, Sym.slash]));
        if(mulop === Sym.times) {
            gen(code, Fct.opr, 0, 4);
        } else gen(code, Fct.opr, 0, 5);
    }
}

const expression = (level: number, tokens: Token[], code: Code[], table: Table[], setOfSym: Sym[]) => {
    let addop;
    if([Sym.plus, Sym.minus].includes(tokens[index].knd)) {
        addop = tokens[index].knd;
        index++;
        term(level, tokens, code, table, setOfSym.concat([Sym.plus, Sym.minus]));
        if (addop === Sym.minus) {
            gen(code, Fct.opr, 0, 1); // pre-fix expression
        } else term(level, tokens, code,table, setOfSym.concat([Sym.plus, Sym.minus]));

    } else term(level, tokens, code, table, setOfSym.concat([Sym.plus, Sym.minus]));

    while([Sym.plus, Sym.minus].includes(tokens[index].knd)) {
        addop = tokens[index].knd;
        index++;
        term(level, tokens, code, table, setOfSym.concat([Sym.plus, Sym.minus]));
        if (addop === Sym.plus) gen(code, Fct.opr, 0, 2);
        else gen(code, Fct.opr, 0, 3);
    }
}

const condition = (level: number, tokens: Token[], code: Code[], table: Table[], setOfSym: Sym[]) => {
    if(tokens[index].knd === Sym.oddsym) {
        index++;
        expression(level, tokens, code, table, setOfSym);
        gen(code, Fct.opr, 0, 6);
    } else {
        expression(level, tokens, code, table, setOfSym.concat([Sym.eql, Sym.neq, Sym.lss, Sym.gtr, Sym.leq, Sym.geq]));
        if(![Sym.eql, Sym.neq, Sym.lss, Sym.gtr, Sym.leq, Sym.geq].includes(tokens[index].knd)) {
            error(20);
        } else {
            let kind = tokens[index].knd;
            index++;
            expression(level, tokens, code, table, setOfSym);
            switch(kind) {
                case Sym.eql:
                    gen(code, Fct.opr, 0, 8);
                case Sym.neq:
                    gen(code, Fct.opr, 0, 9);
                case Sym.lss:
                    gen(code, Fct.opr, 0, 10);
                case Sym.geq:
                    gen(code, Fct.opr, 0, 11);
                case Sym.gtr:
                    gen(code, Fct.opr, 0, 12);
                case Sym.leq:
                    gen(code, Fct.opr, 0, 13);
            }
        }
    }
}

const statement = (lev: number, tokens: Token[], table: Table[], code: Code[], setOfSym: Sym[]) => {
    let cx1: number = 0;
    let cx2: number = 0;
    let len: number = tokens.length;
    if(index < len && tokens[index].knd === Sym.ident) {
        let i = position(table, tokens[index].val as string)
        if( i === -1) error(11)
        else {
            if(table[i].knd !== "VARIABLE") {
                //assignment to non-variable
                error(12);
                i = -1;
                
            }
            index++;
            if(index < len && tokens[index].knd === Sym.becomes) {
                index++;
                expression(lev, tokens, code, table, setOfSym); //To be completed
                if(i !== -1) {
                    gen(code, Fct.sto, lev - table[i].level as number, table[i].adr as number)
                }
            }
        }
    } else if(index + 1 < len && tokens[index].knd === Sym.callsym){
        index++;
        if(tokens[index].knd !== Sym.ident) {
            error(14);
        } else {
            let i = position(table, tokens[index].val as string)
            if( i === -1) error(11)
            else {
                if(table[i].knd === "PROC") {
                    gen(code, Fct.cal, lev - table[i].level as number, table[i].adr as number);
                    index++;
                } else error(15)
            }
        }

    } else if(index + 2 < len && tokens[index].knd === Sym.ifsym) {
        index++;
        condition(lev, tokens, code , table, setOfSym.concat([Sym.thensym, Sym.dosym])) //To be completed
        if(tokens[index].knd === Sym.thensym) {
            index++;
            cx1 = cx;
            gen(code , Fct.jpc, 0, 0);
            statement(lev, tokens, table, code, setOfSym);
            code[cx1].a = cx;
        } else error(16)
    } else if(index < len && tokens[index].knd === Sym.beginsym) {
        index++;
        statement(lev, tokens, table, code, setOfSym.concat([Sym.semicolon, Sym.endsym]));
        while(index < len && STATBEGSYS.concat([Sym.semicolon]).includes(tokens[index].knd)){
            if(tokens[index].knd === Sym.semicolon) {
                index++;
                statement(lev, tokens, table, code, setOfSym.concat([Sym.semicolon, Sym.endsym]));
            } else error(10);
        }
        if(tokens[index].knd === Sym.endsym) {
            index++;
        } else error(17);
    } else if(index < len && tokens[index].knd === Sym.whilesym) {
        cx1 = cx;
        index++;
        condition(lev, tokens, code, table, setOfSym.concat([Sym.dosym]));
        cx2 = cx;
        gen(code, Fct.jpc, 0, 0);
        index++;
        if(index < len && tokens[index].knd === Sym.dosym) {
            index++;
            statement(lev, tokens, table, code, setOfSym);
            gen(code, Fct.jmp, 0, cx1);
            code[cx2].a = cx;

        } else error(18);

    }
    test(tokens, setOfSym, [], 19);
}

function block(levl: number, tokens: Token[], tab: Table[], code: Code[], setOfSym: Sym[]) {
    dx = 3;
    let tx0 = tab.length - 1 < 0 ? 0 :  tab.length - 1; 
    if ( tx0 === 0 ) {
        tab[tx0] = {adr:0, name:"name", knd: "CONSTANT"}
    }
    gen(code, Fct.jmp,0,0);
    let len: number = tokens.length;
    let table: Table[] = tab;
    let level: number = levl;

    while (index < len && DECLBEGSYS.includes(tokens[index].knd)) {

        if (tokens[index].knd === Sym.constsym) {
            do {
                index++;
                constDeclaration(len, table, tokens);
                while (index < len && tokens[index].knd === Sym.comma) {
                    index++;
                    constDeclaration(len, table, tokens);
                }
                if (index < len && expectedSemicolon(tokens[index])) {
                    index++;
                }
            } while(index < len && expectedIdent(tokens[index]))
            continue;
        } else if (tokens[index].knd === Sym.varsym) {
            do {
                index++;
                varDeclaration(len, table, tokens, level);
                while (tokens[index].knd === Sym.comma) {
                    index++;
                    varDeclaration(len, table, tokens, level);
                }
                if (index < len && expectedSemicolon(tokens[index])) {
                    index++;
                }
            } while(index < len && expectedIdent(tokens[index]))
        } else if (tokens[index].knd === Sym.procsym) {
            while (index < len && tokens[index].knd === Sym.procsym) {
                index++;
                proDeclaration(len, table, tokens, level);
                if (index < len && expectedSemicolon(tokens[index])) {
                    index++;
                } else error(4)
                block(level + 1, tokens, table, code, setOfSym.concat([Sym.semicolon]));
                // wrong logic remove and replace index = tokens.length;
                if (index < len && expectedSemicolon(tokens[index])) {
                    index++;
                    test(tokens, STATBEGSYS.concat[Sym.ident, Sym.procsym],setOfSym, 6)
                } else error(5);
            }

        }
        test(tokens, STATBEGSYS.concat([Sym.ident]), DECLBEGSYS, 7)

    }
    code[table[tx0].adr].a  = cx;
    table[tx0].adr = cx; //start adr of code
    cx0 = 0; //cx 
    gen(code, Fct.int, 0, dx);
    statement(level, tokens, table, code, setOfSym.concat([Sym.semicolon, Sym.endsym]));
    gen(code, Fct.opr, 0, 0); //return
    test(tokens, setOfSym, [], 8);
    //listcode;
    return ;
}


export function parser(tokens: Token[]) {
    let tab: Table[] = [];
    let code: Code[] = [];
    let setOfSys: Sym[] = DECLBEGSYS.concat(STATBEGSYS).concat([Sym.period])
    block(0, tokens, tab, code, setOfSys)
    return {code: code, table: tab};
}