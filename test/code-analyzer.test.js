import assert from 'assert';
import {parseCode} from '../src/js/code-analyzer';
import {extractData} from '../src/js/code-analyzer';

describe('The javascript parser', () => {
    it('is parsing an empty function correctly', () => {
        assert.equal(
            JSON.stringify(parseCode('')),
            '{"type":"Program","body":[],"sourceType":"script","loc":{"start":{"line":0,"column":0},"end":{"line":0,"column":0}}}'
        );
    });

    it('is parsing a simple variable declaration correctly', () => {
        assert.equal(
            JSON.stringify(parseCode('let a = 1;')),
            '{"type":"Program","body":[{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"a","loc":{"start":{"line":1,"column":4},"end":{"line":1,"column":5}}},"init":{"type":"Literal","value":1,"raw":"1","loc":{"start":{"line":1,"column":8},"end":{"line":1,"column":9}}},"loc":{"start":{"line":1,"column":4},"end":{"line":1,"column":9}}}],"kind":"let","loc":{"start":{"line":1,"column":0},"end":{"line":1,"column":10}}}],"sourceType":"script","loc":{"start":{"line":1,"column":0},"end":{"line":1,"column":10}}}'
        );
    });
});
var codeJson = parseCode('let a = 1;');
let data = extractData(codeJson);
var varaiable_a;
for (var i = 0; i < data.length; i++) {
    if(data[i]['Name'] == 'a'){
        varaiable_a = data[i];
    }
}

describe('The javascript parser', () => {
    it('is extracting data from a variable declaration correctly', () => {
        assert.equal(varaiable_a['Line'],1);
        assert.equal(varaiable_a['Type'],'variable declaration');
        assert.equal(varaiable_a['Name'],'a');
        assert.equal(varaiable_a['Condition'],'');
        assert.equal(varaiable_a['Value'],1);
    });

});

codeJson = parseCode(`function binarySearch(X, V, n){
    return -1;
}`);
data = extractData(codeJson);
data = extractData(codeJson);
var func_bin;
var prm_x;
for (i = 0; i < data.length; i++) {
    if(data[i]['Name'] == 'binarySearch'){
        func_bin = data[i];
    }
    if(data[i]['Name'] == 'X' && data[i]['Type'] == 'Param'){
        prm_x = data[i];
    }
}
describe('The javascript parser', () => {
    it('is extracting data from a function declaration correctly', () => {
        assert.equal(func_bin['Line'],1);
        assert.equal(func_bin['Type'],'function declaration');
        assert.equal(func_bin['Condition'],'');
        assert.equal(func_bin['Name'],'binarySearch');
        assert.equal(func_bin['Value'],'');
        assert.equal(prm_x['Line'],1);
        assert.equal(prm_x['Type'],'Param');
        assert.equal(prm_x['Condition'],'');
        assert.equal(prm_x['Name'],'X');
        assert.equal(prm_x['Value'],'');
    });
});

codeJson = parseCode(`function binarySearch(X, V, n){
    let low, high, mid;
    low = 0;
    high = n - 1;
}`);
data = extractData(codeJson);
var ass_exsp;
var ass_exsp_2;
for (i = 0; i < data.length; i++) {
    if(data[i]['Type'] == 'assignment expression' && data[i]['Name'] == 'low'){
        ass_exsp = data[i];
    }
    if(data[i]['Type'] == 'assignment expression' && data[i]['Name'] == 'high'){
        ass_exsp_2 = data[i];
    }
}

describe('The javascript parser', () => {
    it('is extracting data from an expression statement correctly', () => {
        assert.equal(ass_exsp['Line'],3);
        assert.equal(ass_exsp['Type'],'assignment expression');
        assert.equal(ass_exsp['Name'],'low');
        assert.equal(ass_exsp['Value'],0);
        assert.equal(ass_exsp_2['Value'],'n - 1');
    });
});

codeJson = parseCode(`function binarySearch(X, V, n){
    let low, high, mid;
    low = 0;
    high = n - 1;
    while (low <= high) {
    }
}`);
data = extractData(codeJson);
var while_exsp;
for (i = 0; i < data.length; i++) {
    if(data[i]['Type'] == 'while statement' && data[i]['Line'] == 5){
        while_exsp = data[i];
    }
}

describe('The javascript parser', () => {
    it('is extracting data from a while statement correctly', () => {
        assert.equal(while_exsp['Line'],5);
        assert.equal(while_exsp['Type'],'while statement');
        assert.equal(while_exsp['Name'],'');
        assert.equal(while_exsp['Condition'],'low <= high');
        assert.equal(while_exsp['Value'],'');
    });
});

codeJson = parseCode(`function binarySearch(X, V, n){
    let low, high, mid;
    low = 0;
    high = n - 1;
    while (low <= high) {
        mid = (low + high)/2;
        if (X < V[mid])
            high = mid - 1;
    }
}`);
data = extractData(codeJson);
var if_stat;
for (i = 0; i < data.length; i++) {
    if(data[i]['Type'] == 'if statement' && data[i]['Line'] == 7){
        if_stat = data[i];
    }
}

describe('The javascript parser', () => {
    it('is extracting data from an if statement correctly', () => {
        assert.equal(if_stat['Line'],7);
        assert.equal(if_stat['Type'],'if statement');
        assert.equal(if_stat['Name'],'');
        assert.equal(if_stat['Condition'],'X < V[mid]');
        assert.equal(if_stat['Value'],'');
    });
});

codeJson = parseCode(`function binarySearch(X, V, n){
    let low, high, mid;
    low = 0;
    high = n - 1;
    while (low <= high) {
        mid = (low + high)/2;
        if (X < V[mid])
            high = mid - 1;
        else if (X > V[mid])
            low = mid + 1;
    }
}`);
data = extractData(codeJson);
var else_if_stat;
for (i = 0; i < data.length; i++) {
    if(data[i]['Type'] == 'else if statement' && data[i]['Line'] == 9){
        else_if_stat = data[i];
    }
}

describe('The javascript parser', () => {
    it('is extracting data from an else if statement correctly', () => {
        assert.equal(else_if_stat['Line'],9);
        assert.equal(else_if_stat['Type'],'else if statement');
        assert.equal(else_if_stat['Name'],'');
        assert.equal(else_if_stat['Condition'],'X > V[mid]');
        assert.equal(else_if_stat['Value'],'');
    });
});

codeJson = parseCode(`function binarySearch(X, V, n){
    let low, high, mid;
    low = 0;
    high = n - 1;
    while (low <= high) {
        mid = (low + high)/2;
        if (X < V[mid])
            high = mid - 1;
        else if (X > V[mid])
            low = mid + 1;
        else
            low = mid + 1;
    }
}`);
data = extractData(codeJson);
var else_stat;
for (i = 0; i < data.length; i++) {
    if(data[i]['Type'] == 'else statement' && data[i]['Line'] == 11){
        else_stat = data[i];
    }
}

describe('The javascript parser', () => {
    it('is extracting data from an else statement correctly', () => {
        assert.equal(else_stat['Line'],11);
        assert.equal(else_stat['Type'],'else statement');
        assert.equal(else_stat['Name'],'');
        assert.equal(else_stat['Condition'],'');
        assert.equal(else_stat['Value'],'');
    });
});

codeJson = parseCode(`function binarySearch(X, V, n){
    let low, high, mid;
    low = 0;
    high = n - 1;
    while (low <= high) {
        mid = (low + high)/2;
        if (X < V[mid])
            high = mid - 1;
        else if (X > V[mid])
            low = mid + 1;
        else
            return mid;
    }
    return -1;
}`);
data = extractData(codeJson);
var ret_stat;
for (i = 0; i < data.length; i++) {
    if(data[i]['Type'] == 'return statement' && data[i]['Line'] == 14){
        ret_stat = data[i];
    }
}

describe('The javascript parser', () => {
    it('is extracting data from a return statement correctly', () => {
        assert.equal(ret_stat['Line'],14);
        assert.equal(ret_stat['Type'],'return statement');
        assert.equal(ret_stat['Name'],'');
        assert.equal(ret_stat['Condition'],'');
        assert.equal(ret_stat['Value'],'-1');
    });
});

codeJson = parseCode(`function binarySearch(X, V, n){
    let low, high, mid;
    low = 0;
    high = n - 1;
    while (low <= high) {
        mid = (low + high)/2;
        if (X < V[mid])
            high = mid - 1;
        else if (X > V[mid])
            low = mid + 1;
        else
            return mid;
    }
    return -1;
}`);
data = extractData(codeJson);
var comp_exsp;
for (i = 0; i < data.length; i++) {
    if(data[i]['Type'] == 'assignment expression' && data[i]['Line'] == 6){
        comp_exsp = data[i];
    }
}

describe('The javascript parser', () => {
    it('is extracting data from a complicated expression correctly', () => {
        assert.equal(comp_exsp['Value'],'(low + high) / 2');
    });
});

codeJson = parseCode(`function binarySearch(X, V, n){
    let low, high, mid;
    low = 0;
    high = n - 1;
    while (low <= high) {
        mid = (low + high)/2;
        if (X < V[mid]){
            high = mid - 1;
        }else if (X > V[mid]){
            low = mid + 1;
        }
    }
    return -1;
}`);
data = extractData(codeJson);
var if_with_block_stat;
for (i = 0; i < data.length; i++) {
    if(data[i]['Type'] == 'if statement' && data[i]['Line'] == 7){
        if_with_block_stat = data[i];
    }
}

describe('The javascript parser', () => {
    it('is extracting data from an if statement correctly', () => {
        assert.equal(if_with_block_stat['Line'],7);
        assert.equal(if_with_block_stat['Type'],'if statement');
        assert.equal(if_with_block_stat['Name'],'');
        assert.equal(if_with_block_stat['Condition'],'X < V[mid]');
        assert.equal(if_with_block_stat['Value'],'');
    });
});

codeJson = parseCode(`function binarySearch(X, V, n){
    let low, high, mid;
    low = 0;
    high = n - 1;
    while (low <= high) {
        mid = (low + high)/(2 + 3);
        if (X < V[mid]){
            high = mid - 1;
        }else if (X > V[mid]){
            low = mid + 1;
        }
    }
    return -1;
}`);
data = extractData(codeJson);
var comp_exp_2;
for (i = 0; i < data.length; i++) {
    if(data[i]['Type'] == 'assignment expression' && data[i]['Line'] == 6){
        comp_exp_2 = data[i];
    }
}

describe('The javascript parser', () => {
    it('is extracting data from a complicated expression correctly', () => {
        assert.equal(comp_exp_2['Value'],'(low + high) / (2 + 3)');
    });
});

codeJson = parseCode(`for(var i = 0; i < length; i++){
    let a = 1;
    let b = 1;
}`);
data = extractData(codeJson);
var for_exp;
for (i = 0; i < data.length; i++) {
    if(data[i]['Type'] == 'for statement' && data[i]['Line'] == 1){
        for_exp = data[i];
    }
}

describe('The javascript parser', () => {
    it('is extracting data from a while statement correctly', () => {
        assert.equal(for_exp['Line'],1);
        assert.equal(for_exp['Type'],'for statement');
        assert.equal(for_exp['Name'],'');
        assert.equal(for_exp['Condition'],'i < length');
        assert.equal(for_exp['Value'],'');
    });
});




