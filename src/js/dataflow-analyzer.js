import * as esprima from 'esprima';
import * as escodegen from 'escodegen';

var LineTypesEnum = Object.freeze(
    {
        'DontTouch':'DontTouch',
        'while statement':'while statement',
        'if statement':'if statement',
        'else if statement':'else if statement',
        'else statement':'else statement',
        'assignment expression': 'assignment expression',
        'return statement': 'return statement'
    })
var substitute_handlers = {
    'return statement' : subRetHandler
};

var lineHandlers = {
    //'DontTouch' : dontTouchLineHandler,
    //'while statement' : whileLineHandler,
    //'if statement' : ifLineHandler,
    //'else statement' : elseLineHandler,
    //'else if statement' : elseIfLineHandler,
    //'assignment expression': assgnmentLineHandler,
    'return statement' : retLineHandler
};

var exphandlers = {
    BinaryExpression : bExspHandler,
    //UnaryExpression : uExspHandler,
    //MemberExpression : mExspHandler,
    //UpdateExpression : updateExspHandler,
    //Literal : literalHandler,
    Identifier : identifierHandler
};

function test(){

}

function substituteData(global_defs, data){
    data.sort(function(a, b){return a['Line']-b['Line'];});
    var ans = data.slice();
    for (let i = 0; i < ans.length; i++) {
        var curr_element = data[i];
        if(curr_element.Type in substitute_handlers){
            substitute_handlers[curr_element.Type](data, ans, curr_element, ans[i], global_defs, i);
        }
    }
    return ans;
}

function substituteCode(codeString, substituted_data){
    var codeArray = codeString.match(/[^\r\n]+/g);
    var ans = [];
    for (let i = 0; i < codeArray.length; i++) {
        var currLine = codeArray[i];
        var lineNum = i +1;
        var lineData = substituted_data.filter(element => (element.Line == lineNum));
        var lineType = getLineType(currLine, lineData);
        if(lineType in lineHandlers){
            var newLine = lineHandlers[lineType](currLine, lineNum, lineData);
            ans.push(newLine);
        }
    }
    return ans;
}

function getLineType(currLine, lineData) {
    if(dontTouchLine(lineData)){
        return LineTypesEnum.DontTouch;
    }else{
        return extractLineType(lineData);
    }
}

function extractLineType(lineData) {
    var lineTypes = lineData.map(x => x.Type);
    var handleTypes = Object.keys(LineTypesEnum).filter(x => x!= 'DontTouch');
    for (let i = 1; i < handleTypes.length; i++){
        if(handleTypes[i] in lineTypes){
            return LineTypesEnum[handleTypes];
        }
    }
    console.log('problem_extractLineType')
}

function dontTouchLine(lineData) {
    if(lineData.length == 0){
        return true;
    }
    var types = lineData.map(x => x.Type);
    var dontTouchTypes = ['function declaration'];
    for (let i = 0; i < types.length; i++) {
        var currType = types[i];
        if(currType in dontTouchTypes){
            return true;
        }
    }
    return false;
}

function subRetHandler(data, subData, origElement, subElement, globalDefs, i) {
    var codeJson = esprima.parseScript(origElement.Value).body[0].expression;
    subElement.Value = escodegen.generate(substituteExp(codeJson, subData, i, globalDefs));
}

function substituteExp(json, subData,i ,globalDefs) {
    return exphandlers[json.type](json, subData,i ,globalDefs);
}

function getGlobalDefs(data, codeString) {
    var ans = [] ;
    var arrayOfLines = codeString.match(/[^\r\n]+/g);
    for (var i = 0; i < arrayOfLines.length; i++) {
        var defs = getDefinitions(i+1, data.slice());
        for (var j = 0; j < defs.length; j++) {
            ans.push.apply(ans ,findDCPs(defs[j], data, codeString));
        }
    }
    return ans;
}

function findDCPs(def, data, codeString) {
    var ans = [];
    var left_most = {
        start: {line:def.loc.start.line+1, column:def.loc.start.column},
        end: {line:def.loc.end.line, column:def.loc.end.column}
    };
    while(isFeasible(def.loc, left_most, codeString)){
        var uses = getUses(def.id, left_most.start.line, data);
        uses.sort(function(a, b){return a.loc.start.column-b.loc.start.column;});
        for (var i = 0; i < uses.length; i++) {
            if(uses[i].Value ==null){
                ans.push({def:def, node:uses[i]});
            }
            if(isDefinitionUse(uses[i])){
                left_most = getScopeEnd(left_most, codeString);
            }
        }
        left_most.start.line +=1;
        left_most.end.column =0;
    }
    return ans;
}
function getDefinitions(line, data) {
    var ans = [];
    var uses =  data.filter(element => (element.Line == line) && (isDefinition(element)));
    for (var i = 0; i < uses.length; i++) {
        ans.push(createUse(uses[i].Name, uses[i].loc, uses[i].Value));
    }
    return ans;
}

function getUses(id , line, data) {
    var ans = [];
    var line_elements =  data.filter(element => (element.Line == line));
    for (var i = 0; i < line_elements.length; i++) {
        var element =line_elements[i];
        if(isDefinition(element) && element.Name == id){
            ans.push(createUse(id, element.loc, element.Value));
        }
        if(is_c_use_in_element(id, element) || is_p_use_in_element(id, element)){
            ans.push(createUse(id, element.loc, null));
        }
    }
    return ans;

}

function isDefinition(element) {
    var isAssignment = element.Type == 'assignment expression';
    var isDeclerationWithAssignment = element.Type == 'variable declaration' && element.Value!=null;
    return isAssignment || isDeclerationWithAssignment;
}

function isDefinitionUse(use) {
    return use.Value!=null;
}

function is_c_use_in_element(id, element){
    var c_use_indicatorr = '';
    c_use_indicatorr.concat(' ', id, ' ');
    var value = element.Value.toString();
    var name = element.Name;
    var c_use_in_value = value !=null&& value.includes(c_use_indicatorr);
    var c_use_in_name = name !=null&& name.includes(c_use_indicatorr);
    return c_use_in_value || c_use_in_name;
}

function is_p_use_in_element(id, element){
    var p_use_indicatorr = '';
    p_use_indicatorr.concat(' ', id, ' ');
    var cond =element.Condition;
    return cond !=null && cond.includes(p_use_indicatorr);
}

function createUse(id, loc, value){
    return {
        id:id,
        loc:loc,
        Value: value
    };
}


function isFeasible(loc_1, loc_2, codeString){
    var arrayOfLines = codeString.match(/[^\r\n]+/g);
    var stack = [];
    var i = loc_1.start.line-1;
    var j = loc_1.start.column;
    var curr_char;
    for(i; i < loc_2.start.line;i++) {
        if(i != loc_1.start.line-1){
            j =0;
        }
        for(j; j < arrayOfLines[i].length;j++){
            if(reachedLoc(i +1, j, loc_2)){
                return true;
            }
            curr_char = arrayOfLines[i][j];
            if(curr_char == '{'){
                stack.push('{');
            }else if(curr_char == '}'){
                if(stack.length ==0){
                    return false;
                }
                stack.pop();
            }
        }
    }
}

function reachedLoc(i, j, loc_2) {
    if(i == loc_2.start.line  && j == loc_2.start.column-2){
        return true;
    }
}

function getScopeEnd(loc, codeString){
    var arrayOfLines = codeString.match(/[^\r\n]+/g);
    var i = loc.start.line-1;
    var j = loc.start.column;
    var curr_char;
    for(i; i < arrayOfLines.length;i++) {
        if(i != loc.start.line-1){
            j =0;
        }
        for(j; j < arrayOfLines[i].length;j++){
            curr_char = arrayOfLines[i][j];
            if(curr_char == '}'){
                loc.start.line = i+1;
                loc.start.column = j;
                return loc;
            }
        }
    }
}



function identifierHandler(iExp , subData, i, globalDefs) {
    var identifier = iExp.name;
    var globalDef = getGlobalDef(identifier, subData, i ,globalDefs);
    iExp.name = globalDef.Value;
    return iExp;
}

function bExspHandler(bExp , subData, i) {

}
function getGlobalDef(identifier, subData, index ,globalDefs){
    for (let i = 0; i < globalDefs.length ; i++){
        var currGlblDefNode = globalDefs[i].node;
        var nodeLine = currGlblDefNode.loc.start.line;
        var elementLine = subData[index].Line;
        if(currGlblDefNode.id == identifier && elementLine == nodeLine){
            return globalDefs[i].def;
        }
    }
    console.log('problem_getGlobalDef()');
}

function retLineHandler(currLine, lineNum, lineData){
    var ans = '';
    var idxOfReturnEnd = currLine.lastIndexOf('return');
    var retString = currLine.substring(0, idxOfReturnEnd);
    var retValue = lineData.filter(d => d.Type == 'return statement')[0].Value;
    return ans.concat(retString, ' ', retValue);
}
export {getGlobalDefs};
export {findDCPs};
export {getDefinitions};
export {substituteData};
export {substituteCode};
export {isFeasible};
export {getUses};
export {test};