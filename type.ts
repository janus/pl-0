export const NORW = 11;     //no. of reserved words
export const TXMAX = 100;   //length of identifier table
export const NMAX = 14;     //max. no. of digits in numbers
export const AL = 10;       //length of identifiers
export const AMAX = 2047;   //maximum address
export const LEVMAX = 3;    //maximum depth of block nesting
export const CXMAX = 200;   //size of code array



interface Ssym {
    [key: string]: Sym;
} 


export interface Token {
    knd: Sym,
    val?: string | number 
}



export enum Sym {
    nul = 0,
    ident,
    number,
    string,
    dots,
    plus,
    minus,
    times,
    slash,
    oddsym,
    eql,
    neq,
    lss,
    leq,
    gtr,
    geq,
    lparen,
    rparen,
    comma,
    semicolon,
    period,
    becomes,
    beginsym,
    endsym,
    ifsym,
    thensym,
    whilesym,
    dosym,
    callsym,
    constsym,
    varsym,
    procsym

}

export const operatorSymbol: Ssym = {
    "+": Sym.plus,
    "-": Sym.minus,
    "*": Sym.times,
    "(": Sym.lparen,
    "=": Sym.eql,
    ".": Sym.period,
    "<": Sym.lss,
    "[": Sym.leq,
    ";": Sym.semicolon,
    "/": Sym.slash,
    ")": Sym.rparen,
    ",": Sym.comma,
    "#": Sym.neq,
    ">": Sym.gtr,
    "]": Sym.geq
};

export const getSymForKeyword = (keyword: string) => {
    switch(keyword) {
        case "begin":
            return Sym.beginsym;
        case "call":
            return Sym.callsym;
        case "const":
            return Sym.constsym;
        case "do":
            return Sym.dosym;
        case "end":
            return Sym.endsym;
        case "if":
            return Sym.ifsym;
        case "odd":
            return Sym.oddsym;
        case "procedure":
            return Sym.procsym;
        case "then":
            return Sym.thensym;
        case "var":
            return Sym.varsym;
        case "while":
            return Sym.whilesym;
        default:
            return Sym.ident;
    } 
}


export enum Fct {
    lit,
    opr,
    lod,
    sto,
    cal, 
    int,
    jmp,
    jpc
}
export interface Alfa {
    len: number,
    alfa: string,
}



export interface Instruction {
    opcode: Fct,
    level: number,
    levelMax: number,
    displacement: number,
    displacementMax: number

}

export interface Table {
    name: string,
    knd: "CONSTANT" | "VARIABLE" | "PROC",
    level?: number,
    adr?: number,
    val?: number,
}

export const Statement = 0;

export interface Code {
    f: Fct,
    a: number,
    l: number,
}


export const DECLBEGSYS = [Sym.constsym, Sym.varsym, Sym.procsym];
export const STATBEGSYS = [Sym.beginsym, Sym.callsym, Sym.ifsym, Sym.whilesym];
export const FACBEGSYS  = [Sym.ident, Sym.number, Sym.lparen];


export interface ParseReturns {
    code: Code[],
    table: Table[]
}