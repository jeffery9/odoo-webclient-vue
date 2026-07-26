export class Expression {
    static parse(expr) {
        const tokens = this.tokenize(expr);
        const parser = new ExprParser(tokens);
        return parser.parse();
    }
    static evaluate(node, env) {
        switch (node.type) {
            case 'literal':
                return node.value;
            case 'identifier':
                return env[node.name];
            case 'binary': {
                const leftVal = this.evaluate(node.left, env);
                const rightVal = this.evaluate(node.right, env);
                switch (node.operator) {
                    case '==': return leftVal === rightVal;
                    case '!=': return leftVal !== rightVal;
                    case '<': return leftVal < rightVal;
                    case '<=': return leftVal <= rightVal;
                    case '>': return leftVal > rightVal;
                    case '>=': return leftVal >= rightVal;
                }
                return false;
            }
            case 'logical': {
                const leftVal = this.evaluate(node.left, env);
                if (node.operator === 'and') {
                    return leftVal && this.evaluate(node.right, env);
                }
                else {
                    return leftVal || this.evaluate(node.right, env);
                }
            }
            case 'unary': {
                const val = this.evaluate(node.operand, env);
                if (node.operator === 'not') {
                    return !val;
                }
                return false;
            }
            case 'dictionary': {
                const result = {};
                for (const [key, exprNode] of Object.entries(node.properties)) {
                    result[key] = this.evaluate(exprNode, env);
                }
                return result;
            }
            case 'array': {
                return node.elements.map(el => this.evaluate(el, env));
            }
        }
    }
    static tokenize(input) {
        const tokens = [];
        let i = 0;
        while (i < input.length) {
            const char = input[i];
            if (/\s/.test(char)) {
                i++;
                continue;
            }
            if (char === "'" || char === '"') {
                const quote = char;
                let str = '';
                i++;
                while (i < input.length && input[i] !== quote) {
                    str += input[i];
                    i++;
                }
                i++;
                tokens.push(quote + str + quote);
                continue;
            }
            if (['{', '}', ':', ',', '(', ')', '[', ']'].includes(char)) {
                tokens.push(char);
                i++;
                continue;
            }
            if (char === '=' || char === '!' || char === '<' || char === '>') {
                let op = char;
                if (input[i + 1] === '=') {
                    op += '=';
                    i++;
                }
                tokens.push(op);
                i++;
                continue;
            }
            if (/[a-zA-Z0-9_\.]/.test(char)) {
                let word = '';
                while (i < input.length && /[a-zA-Z0-9_\.]/.test(input[i])) {
                    word += input[i];
                    i++;
                }
                tokens.push(word);
                continue;
            }
            throw new Error(`Unexpected character in expression: ${char}`);
        }
        return tokens;
    }
}
class ExprParser {
    tokens;
    current = 0;
    constructor(tokens) {
        this.tokens = tokens;
    }
    peek() {
        return this.tokens[this.current];
    }
    consume() {
        return this.tokens[this.current++];
    }
    parse() {
        return this.parseExpression();
    }
    parseExpression() {
        const node = this.parsePrimary();
        const nextToken = this.peek();
        if (nextToken && ['==', '!=', '<', '<=', '>', '>=', 'and', 'or'].includes(nextToken)) {
            const op = this.consume();
            const right = this.parseExpression();
            if (op === 'and' || op === 'or') {
                return { type: 'logical', operator: op, left: node, right };
            }
            else {
                return { type: 'binary', operator: op, left: node, right };
            }
        }
        return node;
    }
    parsePrimary() {
        const token = this.peek();
        if (!token) {
            throw new Error('Unexpected end of expression');
        }
        if (token === 'not') {
            this.consume();
            const operand = this.parsePrimary();
            return { type: 'unary', operator: 'not', operand };
        }
        if (token === '{') {
            return this.parseDictionary();
        }
        if (token === '[') {
            return this.parseArray();
        }
        if (token === '(') {
            return this.parseTupleOrParentheses();
        }
        this.consume();
        if ((token.startsWith("'") && token.endsWith("'")) || (token.startsWith('"') && token.endsWith('"'))) {
            return { type: 'literal', value: token.slice(1, -1) };
        }
        if (token === 'True')
            return { type: 'literal', value: true };
        if (token === 'False')
            return { type: 'literal', value: false };
        if (token === 'None')
            return { type: 'literal', value: null };
        if (/^\d+(\.\d+)?$/.test(token)) {
            return { type: 'literal', value: Number(token) };
        }
        return { type: 'identifier', name: token };
    }
    parseDictionary() {
        this.consume(); // skip '{'
        const properties = {};
        while (this.peek() && this.peek() !== '}') {
            const keyToken = this.consume();
            const key = ((keyToken.startsWith("'") && keyToken.endsWith("'")) || (keyToken.startsWith('"') && keyToken.endsWith('"')))
                ? keyToken.slice(1, -1)
                : keyToken;
            const colon = this.consume();
            if (colon !== ':') {
                throw new Error(`Expected ':' after key in dictionary, got ${colon}`);
            }
            const valNode = this.parseExpression();
            properties[key] = valNode;
            if (this.peek() === ',') {
                this.consume();
            }
            else if (this.peek() !== '}') {
                throw new Error(`Expected ',' or '}' in dictionary, got ${this.peek()}`);
            }
        }
        const close = this.consume();
        if (close !== '}') {
            throw new Error(`Expected '}' to close dictionary, got ${close}`);
        }
        return { type: 'dictionary', properties };
    }
    parseArray() {
        this.consume(); // skip '['
        const elements = [];
        while (this.peek() && this.peek() !== ']') {
            elements.push(this.parseExpression());
            if (this.peek() === ',') {
                this.consume();
            }
        }
        const close = this.consume(); // skip ']'
        if (close !== ']')
            throw new Error(`Expected ']' to close array`);
        return { type: 'array', elements };
    }
    parseTupleOrParentheses() {
        this.consume(); // skip '('
        const first = this.parseExpression();
        if (this.peek() === ')') {
            this.consume(); // skip ')'
            return first; // parenthesized expression
        }
        const elements = [first];
        while (this.peek() && this.peek() !== ')') {
            if (this.peek() === ',') {
                this.consume();
            }
            if (this.peek() !== ')') {
                elements.push(this.parseExpression());
            }
        }
        const close = this.consume(); // skip ')'
        if (close !== ')')
            throw new Error(`Expected ')' to close tuple`);
        return { type: 'array', elements };
    }
}
//# sourceMappingURL=expression.js.map