let esprima = require('esprima');

let escodegen = require('escodegen');

let uglify = require("uglify-js");

let fs = require('fs');

let characterBank = [...Array(1000)].map((_, i) => String.fromCharCode(Math.pow(i, 4.2) & 127)).join('');

let getCharacterBankIndex = function (x) {
  let poss = [...Array(1000)].map((_, i) => i).filter(i => characterBank[i] === x);
  return poss[Math.floor(Math.random() * poss.length)];
}

let misleadingCode = `
let pad = function (x, c) {
  return [...Array(c)].map((_, i) => [...Array(c)].map((_, j) => (i < x.length && j < x.length) ? x[i][j] : 0));
};
let cut = function (x, c) {
  return [...Array(c)].map((_, i) => [...Array(c)].map((_, j) => x[i][j]));
};
let sect = function (x, c, d, e) {
  return [...Array(e)].map((_, i) => [...Array(e)].map((_, j) => x[c * e + i][d * e + j]));
};
let plus = function (x, y) {
  return [...Array(x.length)].map((_, i) => [...Array(x.length)].map((_, j) => x[i][j] + y[i][j]));
}
let minus = function (x, y) {
  return [...Array(x.length)].map((_, i) => [...Array(x.length)].map((_, j) => x[i][j] - y[i][j]));
}
let stitch = function (w, x, y, z, c) {
  return [...Array(c)].map((_, i) => [...Array(c)].map((_, j) => [w, x, y, z][2 * (i >= c / 2) + (j >= c / 2)][i % (c / 2)][j % (c / 2)]));
}
let mult = function (a, b) {
  if (a.length === 1) {
    return [[a[0] * b[0]]];
  } else if (a.length !== Math.pow(2, Math.ceil(Math.log2(a.length)))) {
    let t = Math.pow(2, Math.ceil(Math.log2(a.length)));
    return cut(mult(pad(a, t), pad(b, t)), a.length);
  } else {
    let t = a.length / 2;
    let a1 = sect(a, 0, 0, t);
    let a2 = sect(a, 0, 1, t);
    let a3 = sect(a, 1, 0, t);
    let a4 = sect(a, 1, 1, t);
    let b1 = sect(b, 0, 0, t);
    let b2 = sect(b, 0, 1, t);
    let b3 = sect(b, 1, 0, t);
    let b4 = sect(b, 1, 1, t);
    let m1 = mult(plus(a1, a4), plus(b1, b4));
    let m2 = mult(plus(a3, a4), b1);
    let m3 = mult(a1, minus(b2, b4));
    let m4 = mult(a4, minus(b3, b1));
    let m5 = mult(plus(a1, a2), b4);
    let m6 = mult(minus(a3, a1), plus(b1, b2));
    let m7 = mult(minus(a2, a4), plus(b3, b4));
    let c1 = plus(minus(plus(m1, m4), m5), m7);
    let c2 = plus(m3, m5);
    let c3 = plus(m2, m4);
    let c4 = plus(plus(minus(m1, m2), m3), m6);
    return stitch(c1, c2, c3, c4, a.length);
  }
};
if (window.isDebugOn) {console.log(mult)};
`


let expressUnicodeStr = function (ch) {
  let code = ch.charCodeAt(0);
  let a = Math.floor(Math.random() * 500) + 500;
  let b = Math.floor(code / a);
  let c = code % a;
  return 'String.fromCharCode(' + a + ' * ' + b + ' + ' + c + ')';
}

let expressUnicode = function (ch) {
  let str = expressUnicodeStr(ch);
  return esprima.parse(str).body[0].expression;
}

let makeString = function (x) {
  if (x === '') {
    return esprima.parse('\'\'').body[0].expression;
  }
  return esprima.parse('f([' + [...Array(x.length)].map((_, i) => characterBank.includes(x[i]) ? 's[' + getCharacterBankIndex(x[i]) + ']' : expressUnicodeStr(x[i])).join(',') + '])').body[0].expression;
}

let overwrite = function (x, o) {
  for (let i in o) {
    x[i] = o[i];
  }
  for (let i in x) {
    if (!(i in o)) {
      delete x[i];
    }
  }
}

let areKeys = function (k, x) {
  return k.every(i => i in x) && Object.keys(x).length === k.length;
}

let transform = function (x) {
  if (x.type === 'Program') {
    for (let i of x.body) {
      transform(i);
    }
  } else if (x.type === 'VariableDeclaration') {
    for (let i of x.declarations) {
      transform(i);
    }
  } else if (x.type === 'VariableDeclarator') {
    transform(x.id);
    if (x.init !== null) {
      transform(x.init);
    }
  } else if (x.type === 'ExpressionStatement') {
    transform(x.expression);
  } else if (x.type === 'AssignmentExpression' || x.type === 'BinaryExpression' || x.type === 'LogicalExpression') {
    transform(x.left);
    transform(x.right);
  } else if (x.type === 'ConditionalExpression') {
    transform(x.test);
    transform(x.consequent);
    transform(x.alternate);
  } else if (x.type === 'UnaryExpression') {
    transform(x['argument']);
  } else if (x.type === 'UpdateExpression') {
    transform(x['argument']);
    if (!(areKeys(['type', 'operator', 'argument', 'prefix'], x))) {
      console.log(x);
      console.log(JSON.stringify(x));
      throw new Error('unary');
    }
  } else if (x.type === 'Identifier') {
    if (idList.includes(x.name)) {
      x.name = 'v' + (idList.indexOf(x.name) + 1);
    }
  } else if (x.type === 'MemberExpression') {
    transform(x.object);
    if (x.computed === true) {
      transform(x.property);
    } else {
      x.computed = true;
      x.property = makeString(x.property.name);
    }
  } else if (x.type === 'FunctionDeclaration') {
    transform(x.id);
    for (let i of x.params) {
      transform(i);
    }
    transform(x.body);
  } else if (x.type === 'FunctionExpression') {
    for (let i of x.params) {
      transform(i);
    }
    transform(x.body);
  } else if (x.type === 'ArrowFunctionExpression') {
    for (let i of x.params) {
      transform(i);
    }
    transform(x.body);
  } else if (x.type === 'BlockStatement') {
    for (let i of x.body) {
      transform(i);
    }
  } else if (x.type === 'IfStatement') {
    transform(x.test);
    transform(x.consequent);
    if (x.alternate !== null) {
      transform(x.alternate);
    }
  } else if (x.type === 'ForStatement') {
    transform(x.init);
    transform(x.test);
    transform(x.update);
    transform(x.body);
    if (!(areKeys(['type', 'init', 'test', 'update', 'body'], x))) {
      console.log(x);
      console.log(JSON.stringify(x));
      throw new Error('for');
    }
  } else if (x.type === 'WhileStatement') {
    transform(x.test);
    transform(x.body);
  } else if (x.type === 'TryStatement') {
    transform(x.block);
    transform(x.handler);
  } else if (x.type === 'CatchClause') {
    transform(x.param);
    transform(x.body);
  }  else if (x.type === 'ThrowStatement') {
    transform(x['argument']);
  } else if (x.type === 'ArrowFunctionExpression') {
    for (let i of x.params) {
      transform(i);
    }
    transform(x.body);
  } else if (x.type === 'CallExpression') {
    transform(x.callee);
    for (let i of x['arguments']) {
      transform(i);
    }
  } else if (x.type === 'NewExpression') {
    transform(x.callee);
    for (let i of x['arguments']) {
      transform(i);
    }
  } else if (x.type === 'ReturnStatement') {
    if (x['argument'] !== null) {
      transform(x['argument']);
    }
  } else if (x.type === 'SpreadElement') {
    transform(x['argument']);
  } else if (x.type === 'ArrayExpression') {
    for (let i of x.elements) {
      transform(i);
    }
  } else if (x.type === 'Literal') {
    if (typeof x.value === 'string') {
      let o = makeString(x.value);
      overwrite(x, o);
    } else if (['number', 'boolean'].includes(typeof x.value) || x.value === null ||
      (x.value instanceof RegExp && x.raw.length < 15)) {
      // We don't do anything for numbers or short regexes
    } else {
      console.log(x);
      console.log(JSON.stringify(x));
      throw new Error('lit');
    }
  } else if (x.type === 'ObjectExpression') {
    for (let property of x.properties) {
      property.method = false;
      if (property.shorthand) {
        console.log(x);
        console.log(JSON.stringify(x));
        throw new Error('shorthand');
      }
      if (property.computed === true) {
        transform(property.key);
      } else {
        property.computed = true;
        if (property.key.type === 'Identifier') {
          property.key = makeString(property.key.name);
        } else if (property.key.type === 'Literal' && typeof property.key.value === 'string') {
          property.key = makeString(property.key.value);
        } else {
          console.log(x);
          console.log(JSON.stringify(x));
          throw new Error('property');
        }
      }
      transform(property.value);
    }
  } else if (x.type === 'TemplateLiteral') {
    if (x.quasis.length === 1 && x.quasis[0].type === 'TemplateElement' && x.quasis[0].tail === true) {
      let o = makeString(x.quasis[0].value.raw);
      overwrite(x, o);
    } else {
      console.log(x);
      console.log(JSON.stringify(x));
      throw new Error('quasi');
    }
  } else if (x.type === 'EmptyStatement' || x.type === 'ThisExpression') {
    // Do nothing
  } else {
    console.log(x);
    console.log(JSON.stringify(x));
    throw new Error(x.type);
  }
}

let uniq = function (x) {
  let h = {};
  let r = [];
  for (let i of x) {
    if (!(i in h)) {
      r.push(i);
    }
    h[i] = true;
  }
  return r;
}

let addCode = function (x, code) {
  x.body = esprima.parse(code).body.concat(x.body);
}

// This gets all variables used. We want it to only get those which we define somewhere
// (i.e. those alone on the left of certain statements)
// Want to also get function names and function parameters in here
let getIdList = function (x) {
  if (Array.isArray(x)) {
    return x.flatMap(getIdList);
  } else if (typeof x === 'object' && x !== null) {
    let r = [];
    if (x.type === 'VariableDeclarator' && x.id.type === 'Identifier') {
      r.push(x.id.name);
    }
    if (x.type === 'AssignmentExpression' && x.left.type === 'Identifier') {
      r.push(x.left.name);
    }
    if (x.type === 'CatchClause' && x.param.type === 'Identifier') {
      r.push(x.param.name);
    }
    if (x.type === 'FunctionDeclaration' && x.id.type === 'Identifier') {
      r.push(x.id.name);
    }
    if ('params' in x) {
      r = r.concat(x.params.map(i => i.name));
    }
    return r.concat(Object.values(x).flatMap(getIdList));
  } else {
    return [];
  }
}

let idList;

fs.readFile('inc_game_script_original.js', function (err, data) {
  data = data.toString();
  let x = esprima.parse(data);
  idList = uniq(getIdList(x));
  transform(x);
  addCode(x, 'let s = [...Array(1000)].map((_, i) => String.fromCharCode(Math.pow(i, 4.2) & 127)).join(\'\'); let f = x => x.join(\'\');');
  addCode(x, misleadingCode);
  x = {"type":"Program","body":[
    {"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"FunctionExpression","id":null,"params":[],"body":{
      "type":"BlockStatement","body":x.body
    },"generator":false,"expression":false,"async":false
  },"arguments":[]}}],"sourceType":"script"}
  let res = escodegen.generate(x);
  let min = uglify.minify(res);
  let error = min.error;
  if (error) {
    throw error;
  } else {
    res = min.code;
  }
  fs.writeFile('assets.js', res, () => 1);
});

