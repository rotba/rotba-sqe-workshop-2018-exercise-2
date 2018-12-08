import {extractData, parseCode} from './code-analyzer';

function substitute(data, codeString){
    var def_line_1 = 2;
    var def_4 = getDefinitions(def_line_1, data.slice())[0];
    var dcps_4 = findDCPs(def_4, data, codeString);
    var x = 1;

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
            if(isDefinition(uses[i])){
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
            ans.push(createUse(element.Name, element.loc, element.Value));
        }
        if(is_c_use_in_element(id, element) || is_p_use_in_element(id, element)){
            ans.push(createUse(element.Name, element.loc, null));
        }
    }
    return ans;

}

function isDefinition(element) {
    var isAssignment = element.Type == 'assignment expression';
    var isDeclerationWithAssignment = element.Type == 'variable declaration' && element.Value!=null;
    return isAssignment || isDeclerationWithAssignment;
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
            if(i == loc_2.start.line -1 && j == loc_2.end.column-2){
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
function getScopeEnd(loc, codeString){
    var i = loc.start.line-1;
    var j = loc.start.column;
    var curr_char;
    for(i; i < loc.start.line;i++) {
        if(i != loc.start.line-1){
            j =0;
        }
        for(j; j <= loc[i].length;j++){
            curr_char = codeString[i][j];
            if(curr_char == '}'){
                loc.start.line = i+1;
                loc.start.column = j;
                return loc;
            }
        }
    }
}

export {findDCPs};
export {getDefinitions};
export {substitute};
export {isFeasible};
export {getUses};