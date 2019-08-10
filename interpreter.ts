import {parser} from "./parser"
import {tokenize} from "./lexer"
import {ParseReturns, Token} from "./type"



const test = `
const max = 100;
var arg, ret;

procedure isprime;
var i;
begin
	ret := 1;
	i := 2;
	while i < arg do
	begin
		if arg / i * i = arg then
		begin
			ret := 0;
			i := arg
		end;
		i := i + 1
	end
end;

`;

function interpret(source: string) {
    let tokens = tokenize(source);
    let parsed = parser(tokens);
    console.log(parsed.code)
    console.log(parsed.table)

}

console.log(interpret(test));