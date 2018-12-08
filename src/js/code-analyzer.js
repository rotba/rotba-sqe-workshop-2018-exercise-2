import * as esprima from 'esprima';

//All the handlers do similare thing. Calculates the element specific data and returns it
var handlers = {
    FunctionDeclaration : funcDeclHandler,
    VariableDeclaration : varDeclHandler,
    ExpressionStatement : exspStatHandler,
    UpdateExpression: updateStatHandler,
    WhileStatement : whileHandler,
    ForStatement : forHandler,
    IfStatement : ifHandler,
    ReturnStatement : retHandler
};

//Little handler functions to simplify the expression parsing
var exphandlers = {
    BinaryExpression : bExspHandler,
    UnaryExpression : uExspHandler,
    MemberExpression : mExspHandler,
    UpdateExpression : updateExspHandler,
    Literal : literalHandler,
    Identifier : identifierHandler
};

var dict_type_type_name = {
    FunctionDeclaration : 'function declaration',
    VariableDeclaration : 'variable declaration',
    VariableDeclarator: 'variable declaration',
    AssignmentExpression: 'assignment expression',
    UpdateExpression: 'update expression',
    WhileStatement : 'while statement',
    ForStatement : 'for statement',
    IfStatement : 'if statement',
    ReturnStatement : 'return statement'
};


const parseCode = (codeToParse) => {
    return esprima.parseScript(codeToParse, {loc: true});
};

//Recursive function that extracs all the ements of the code described in the given jsn element
function extractData(codeJson) {
    var ans = [];
    if(codeJson.hasOwnProperty('body')){
        if(codeJson['body'] instanceof Array){
            var body_array = codeJson['body'];
            for (var i = 0; i < body_array.length; i++) {
                ans.push.apply(ans ,extractData(body_array[i]));
            }
        }else{
            ans.push.apply(ans ,extractData(codeJson['body']));
        }
    }
    if(codeJson.type in handlers){
        ans.push.apply(ans ,handlers[codeJson.type](codeJson));
    }
    return ans;
}


function funcDeclHandler(funcJson) {
    var ans = [];
    ans.push(
        create_new_elem(funcJson.loc.start.line,funcJson.type,funcJson.id.name,'', '')
    );
    for (var i = 0; i < funcJson.params.length; i++) {
        var param = funcJson.params[i];
        ans.push(
            create_new_elem(param.loc.start.line,'Param',param.name,'', '')
        );
    }
    return ans;
}

function varDeclHandler(verDecJson) {
    var ans = [];
    var declerators = verDecJson.declarations;
    for (var i = 0; i < declerators.length; i++) {
        var value = null;
        if(declerators[i].init != null){
            value = declerators[i].init.value;
        }
        ans.push(
            create_new_elem(
                declerators[i].loc.start.line,
                declerators[i].type,
                declerators[i].id.name,
                value,
                '')
        );
    }
    return ans;
}

function exspStatHandler(expStatJson) {
    var ans = [];
    ans.push(
        create_new_elem(
            expStatJson.loc.start.line,
            expStatJson.expression.type,
            handleExp(expStatJson.expression.left),
            handleExp(expStatJson.expression.right),
            ''
        )
    );
    return ans;
}

function updateStatHandler(updateJson){
    var ans = [];
    ans.push(
        create_new_elem(
            updateJson.loc.start.line,
            updateJson.type,
            handleExp(updateJson.argument),
            handleExp(updateJson),
            ''
        )
    );
    return ans;
}

function whileHandler(whileJson) {
    var ans = [];
    ans.push.apply(ans ,extractData(whileJson['body']));
    var condition = handleExp(whileJson.test);
    ans.push(
        create_new_elem(
            whileJson.loc.start.line,
            whileJson.type,
            '',
            '',
            condition
        )
    );
    return ans;
}

function forHandler(forJson) {
    var ans = [];
    ans.push.apply(ans ,extractData(forJson.init));
    ans.push.apply(ans ,extractData(forJson.update));
    var condition = handleExp(forJson.test);
    ans.push(
        create_new_elem(
            forJson.loc.start.line,
            forJson.type,
            '',
            '',
            condition
        )
    );
    return ans;
}

function ifHandler(ifJson) {
    var ans = [];
    ans.push.apply(ans , handleConsequent(ifJson.consequent));
    var condition = handleExp(ifJson.test);
    ans.push(
        create_new_elem(
            ifJson.loc.start.line,
            ifJson.type,
            '',
            '',
            condition
        )
    );
    ans.push.apply(ans ,ifAlternateHandler(ifJson));
    return ans;
}

//Handles alternates of if statement
function ifAlternateHandler(ifJson) {
    var ans = [];
    let alternate = ifJson.alternate;
    while(alternate != null){
        ans.push.apply(ans , handleConsequent(alternate.consequent));
        let condition = handleExp(alternate.test);
        let type = ( (condition == '') ? 'else statement' : 'else if statement');
        let start_line = ( (type == 'else statement') ? alternate.loc.start.line-1 : alternate.loc.start.line);
        ans.push(
            create_new_elem(start_line,type,'','',condition)
        );
        alternate = alternate.alternate;
    }
    return ans;
}

function retHandler(retJson) {
    var ans = [];
    ans.push(
        create_new_elem(
            retJson.loc.start.line,
            retJson.type,
            '',
            handleExp(retJson.argument),
            ''
        )
    );
    return ans;
}

//Handles consequent. Returns it's data elements
function handleConsequent(consequentJson){
    var ans = [];
    if(consequentJson == null){
        return ans;
    }
    if(consequentJson.type == 'BlockStatement'){
        var body_array = consequentJson['body'];
        for (var i = 0; i < body_array.length; i++) {
            ans.push.apply(ans ,extractData(body_array[i]));
        }
    }else{
        ans.push.apply(ans ,handlers[consequentJson.type](consequentJson));
    }
    return ans;
}

//Gets test json and returns it's condition string
function handleExp(exp) {
    var ans = '';
    if ((exp == null) || !(exp.type in exphandlers)) {
        return ans;
    }
    ans = exphandlers[exp.type](exp);
    return ans;
}

function bExspHandler(exp) {
    var ans = '';
    var brackets = ['', '', '', ''];
    if (exp.left.type == 'BinaryExpression') {
        brackets[0] = '(';
        brackets[1] = ')';
    }
    if (exp.right.type == 'BinaryExpression') {
        brackets[2] = '(';
        brackets[3] = ')';
    }
    ans = ans.concat(
        brackets[0], handleExp(exp.left), brackets[1],
        ' ', exp.operator, ' ',
        brackets[2], handleExp(exp.right), brackets[3]);
    return ans;
}

function mExspHandler(exp) {
    var ans = '';
    ans = ans.concat(handleExp(exp.object), '[', handleExp(exp.property), ']');
    return ans;
}

function uExspHandler(exp) {
    var ans = '';
    ans = ans.concat(exp.operator, handleExp(exp.argument));
    return ans;
}

function updateExspHandler(exp) {
    var ans = '';
    ans = ans.concat(exp.operator, handleExp(exp.argument));
    return ans;
}

function literalHandler(exp) {
    var ans = '';
    ans = ans.concat(exp.raw);
    return ans;
}

function identifierHandler(exp) {
    var ans = '';
    ans = ans.concat(exp.name);
    return ans;
}

//Function that creates an element given it's neccesary details
function create_new_elem(line, type, name, value, condition){
    var type_actual = type;
    if(type in dict_type_type_name){
        type_actual =  dict_type_type_name[type];
    }
    return {
        Line : line,
        Type: type_actual,
        Name: name,
        Condition: condition,
        Value: value
    };
}

export {parseCode};
export {extractData};