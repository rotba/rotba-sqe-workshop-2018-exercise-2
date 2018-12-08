
function substitute(data){
    var line_1 = 7;
    var defs = getDefinitions(line_1, data);

}
function findDCPs(line, data, scopes) {
    return null;
}
function getDefinitions(line, data) {
    var ans = [];
    var uses =  data.filter(element => (element.Line == line) && (isDefinition(element)));
    for (var i = 0; i < uses.lenght; i++) {
        ans.push({id:uses[i].Name, loc:uses[i].loc});
    }
    return ans;
}

function isDefinition(element) {
    var isAssignment = element.Type == 'assignment expression';
    var isDeclerationWithAssignment = element.Type == 'variable declaration' && element.Value!=null;
    return isAssignment || isDeclerationWithAssignment;
}
export {findDCPs};
export {getDefinitions};
export {substitute};