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
        'variable declaration': 'variable declaration',
        'return statement': 'return statement',
        'unknown': 'unknown'
    });
var substitute_handlers = {
    'return statement' : subRetHandler,
    'if statement' : subIfCondHandler,
    'else if statement' : subIfCondHandler,
    'while statement' : subIfCondHandler,
    'assignment expression' : subAssginmentCondHandler,
    'variable declaration' : subAssginmentCondHandler
};

var lineHandlers = {
    'while statement' : whileLineHandler,
    'if statement' : ifLineHandler,
    //'else statement' : elseLineHandler,
    'else if statement' : elseIfLineHandler,
    //'assignment expression': assgnmentLineHandler,
    //'variable declaration': assgnmentLineHandler,
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
    var newLineNumSingelArray = [1];
    for (let i = 0; i < codeArray.length; i++) {
        var currLine = codeArray[i];
        var lineNum = i + 1;
        var lineData = substituted_data.filter(element => (element.Line == lineNum));
        var lineType = getLineType(currLine, lineData);
        if(lineType == 'DontTouch'){
            ans.push(currLine);
            newLineNumSingelArray[0]++;
        }else if(lineType in lineHandlers){
            //updateLineNume(lineData,newLineNum);
            ans.push.apply(ans ,lineHandlers[lineType](currLine, lineNum, lineData, newLineNumSingelArray));
            //ans.push(lineHandlers[lineType](currLine, lineNum, lineData, newLineNumSingelArray));
        }
    }
    return ans.join('\n');
}

function updateLineNum(lineData, newLineNum) {
    for (let i = 0; i <lineData.length ; i++) {
        lineData[i].Line = newLineNum;
    }
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
    for (let i = 0; i < handleTypes.length; i++){
        var curr_type = handleTypes[i];
        if(lineTypes.includes(curr_type)){
            return LineTypesEnum[curr_type];
        }
    }
    return LineTypesEnum['unknown'];
}

function dontTouchLine(lineData) {
    if(lineData.length == 0){
        return true;
    }
    var types = lineData.map(x => x.Type);
    var dontTouchTypes = ['function declaration', 'else statement'];
    for (let i = 0; i < types.length; i++) {
        var currType = types[i];
        if(dontTouchTypes.includes(currType)){
            return true;
        }
    }
    return false;
}

function subRetHandler(data, subData, origElement, subElement, globalDefs, i) {
    var codeJson = esprima.parseScript(origElement.Value).body[0].expression;
    subElement.Value = escodegen.generate(substituteExp(codeJson, subData, i, globalDefs));
}

function subAssginmentCondHandler(data, subData, origElement, subElement, globalDefs, i) {
    var codeJson = esprima.parseScript(origElement.Value).body[0].expression;
    subElement.Value = escodegen.generate(substituteExp(codeJson, subData, i, globalDefs));
    updateGlobalDef(globalDefs, subData[i], subElement.Value);
}
function updateGlobalDef(globalDefs, element, Value) {
    var relevantGlblDefs = globalDefs.filter(x => x.def.id == element.Name && x.def.loc.start.line ==element.Line);
    for (let i = 0; i < relevantGlblDefs.length; i++) {
        relevantGlblDefs[i].def.Value = Value;
    }
}
function subIfCondHandler(data, subData, origElement, subElement, globalDefs, i) {
    var codeJson = esprima.parseScript(origElement.Condition).body[0].expression;
    subElement.Condition = escodegen.generate(substituteExp(codeJson, subData, i, globalDefs));
}

function substituteExp(json, subData,i ,globalDefs) {
    if(json.type =='Literal'){
        return json;
    }else{
        return exphandlers[json.type](json, subData,i ,globalDefs);
    }
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
    var left_most = {start: {line:def.loc.start.line+1, column:def.loc.start.column},end: {line:def.loc.end.line, column:def.loc.end.column}};
    while(isFeasible(def.loc, left_most, codeString)){
        var uses = getUses(def.id, left_most.start.line, data);
        uses.sort(function(a, b){return a.loc.start.column-b.loc.start.column;});
        for (var i = 0; i < uses.length; i++) {
            if(uses[i].Value ==null){
                uses[i].id = uses[i].id.replace(/ /g, '');
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
        if(isDefinition(element) && element.Name.replace(/ /g,'') == id.replace(/ /g,'')){
            ans.push(createUse(id, element.loc, element.Value));
        }
        if(is_c_use_or_p_use(id, element)){
            ans.push(createUse(id, element.loc, null));
        }
    }
    return ans;
}

function is_c_use_or_p_use(id, element) {
    return is_c_use_in_element(id, element) || is_p_use_in_element(id, element);
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
    c_use_indicatorr = c_use_indicatorr.concat(' ', id, ' ').replace('  ', ' ').replace('  ',' ');
    var value = element.Value.toString();
    var name = element.Name;
    var c_use_in_value = value !=null&& value.includes(c_use_indicatorr);
    var c_use_in_name = name !=null&& name.includes(c_use_indicatorr);
    return c_use_in_value || c_use_in_name;
}

function is_p_use_in_element(id, element){
    var p_use_indicatorr = '';
    p_use_indicatorr = p_use_indicatorr.concat(' ', id, ' ');
    var cond =element.Condition;
    return cond !=null && cond.includes(p_use_indicatorr);
}

function createUse(id, loc, value){
    return {
        id:id.replace(/ /g, ''),
        loc:loc,
        Value: value
    };
}


function isFeasible(loc_1, loc_2, codeString){
    var arrayOfLines = codeString.match(/[^\r\n]+/g);
    var stack = [];
    var i = loc_1.start.line-1;
    var j = loc_1.start.column;
    for(i; i < Math.min(loc_2.start.line,arrayOfLines.length);i++) {
        for(j; j < arrayOfLines[i].length;j++){
            if(reachedLoc(i +1, j, loc_2, arrayOfLines[i])) return true;
            var curr_char = arrayOfLines[i][j];
            if(!isEquivalentlBrackets(stack, curr_char)) return false;
        }
        j =0;
    }
}

function isEquivalentlBrackets(stack, curr_char) {
    if(curr_char == '{'){
        stack.push('{');
    }else if(curr_char == '}'){
        if(stack.length ==0){
            return false;
        }
        stack.pop();
    }
    return true;
}

function reachedLoc(i, j, loc_2, line) {
    if(i == loc_2.start.line  && j == loc_2.start.column-2){
        return true;
    }else if(i == loc_2.start.line && j ==(line.length-1)){
        return true;
    }
    return false;
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

function isLocal(identifier, subData, index) {
    for (let i = index; i >= 0; i--) {
        var currElement = subData[i];
        if(currElement.Type == 'variable declaration'){
            if(currElement.Name == identifier){
                return true;
            }
        }else if(currElement.Type == 'function declaration'){
            return false;
        }
    }
    // variable is global
    return false;
}

function identifierHandler(iExp , subData, i, globalDefs) {
    if(isLocal(iExp.name, subData, i)){
        var identifier = iExp.name;
        var globalDef = getGlobalDef(identifier, subData, i ,globalDefs);

        iExp = esprima.parseScript(globalDef.Value).body[0].expression;
        return iExp;
    }else{
        return iExp;
    }

}

function bExspHandler(bExp , subData, i, globalDefs) {
    if(!(bExp.left.type == 'Literal'))
        bExp.left = exphandlers[bExp.left.type](bExp.left , subData, i, globalDefs);
    if(!(bExp.right.type == 'Literal'))
        bExp.right = exphandlers[bExp.right.type](bExp.right , subData, i, globalDefs);
    //bExp.right = exphandlers[bExp.right.type](bExp.right , subData, i, globalDefs);
    return bExp;
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
}

function retLineHandler(currLine, lineNum, lineData, lineNumberArray){
    var ans = [];
    var strAns = '';
    var idxOfReturnEnd = currLine.indexOf('return')+'return'.length;
    var retString = currLine.substring(0, idxOfReturnEnd);
    var retValue = lineData.filter(d => d.Type == 'return statement')[0].Value;
    while(retValue.includes('  ')){
        retValue = retValue.replace('  ', ' ' );
    }
    ans.push(strAns.concat(retString, ' ', retValue, ';'));
    updateLineNum(lineData,lineNumberArray[0]);
    lineNumberArray[0] +=1;
    return ans;
}

function ifLineHandler(currLine, lineNum, lineData, lineNumberArray){
    var ans = [];
    var strAns = '';
    currLine = currLine.replace('if (', 'if(' );
    var idxOfIfEnd = currLine.indexOf('if(')+'if('.length;
    var ifSrtStart = currLine.substring(0, idxOfIfEnd);
    var ifSrtEnd = ') {';
    var ifCond = lineData.filter(d => d.Type == 'if statement')[0].Condition;
    while(ifCond.includes('  ')){
        ifCond = ifCond.replace('  ', ' ' );
    }
    ans.push(strAns.concat(ifSrtStart,  ifCond, ifSrtEnd));
    updateLineNum(lineData,lineNumberArray[0]);
    lineNumberArray[0] +=1;
    return ans;
}

function elseIfLineHandler(currLine, lineNum, lineData,lineNumberArray){
    var ans = [];
    var strAns = '';
    var ifElseStr = 'else if(';
    currLine =adaptIfElse(currLine, ifElseStr);
    var idxOfIfEnd = currLine.indexOf(ifElseStr)+ifElseStr.length;
    var ifSrtStart = currLine.substring(0, idxOfIfEnd);
    var ifSrtEnd = ') {';
    var ifCond = lineData.filter(d => d.Type == 'else if statement')[0].Condition;
    while(ifCond.includes('  ')){
        ifCond = ifCond.replace('  ', ' ' );
    }
    ans.push(strAns.concat(ifSrtStart,  ifCond, ifSrtEnd));
    updateLineNum(lineData,lineNumberArray[0]);
    lineNumberArray[0] +=1;
    return ans;
}

function whileLineHandler(currLine, lineNum, lineData, lineNumberArray){
    var ans = [];
    var strAns = '';
    currLine = currLine.replace('while (', 'while(' );
    var idxOfWhileEnd = currLine.indexOf('while(')+'while('.length;
    var whileSrtStart = currLine.substring(0, idxOfWhileEnd);
    var whileSrtEnd = ') {';
    var ifCond = lineData.filter(d => d.Type == 'while statement')[0].Condition;
    while(ifCond.includes('  ')){
        ifCond = ifCond.replace('  ', ' ' );
    }
    ans.push(strAns.concat(whileSrtStart,  ifCond, whileSrtEnd))
    updateLineNum(lineData,lineNumberArray[0]);
    lineNumberArray[0] +=1;
    return ans;
}

function adaptIfElse(currLine, ifElseStr) {
    currLine = currLine.replace('else if (', ifElseStr);
    return currLine;
}


export {getGlobalDefs};
export {findDCPs};
export {getDefinitions};
export {substituteData};
export {substituteCode};
export {isFeasible};
export {getUses};
