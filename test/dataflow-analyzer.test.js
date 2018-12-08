import assert from 'assert';
import {parseCode} from '../src/js/code-analyzer';
import {extractData} from '../src/js/code-analyzer';
import {findDCPs} from '../src/js/dataflow-analyzer';
import {getDefinitions} from '../src/js/dataflow-analyzer';
import {getUses} from '../src/js/dataflow-analyzer';
import {isFeasible} from '../src/js/dataflow-analyzer';

var codeString_1 = `function foo(x, y, z){
    let a = x + 1;
    let b = a + y;
    let c = 0;
    
    if (b < z) {
        c = c + 5;
        return x + y + z + c;
    } else if (b < z * 2) {
        c = c + x + 5;
        return x + y + z + c;
    } else {
        c = c + z + 5;
        return x + y + z + c;
    }
}`;
var codeJson_1 = parseCode(codeString_1);
var data_1 = extractData(codeJson_1);
var def_line_1 = 7;
var uses_line_1 = 10;

var def_1 = getDefinitions(def_line_1, data_1.slice());
var uses_1 = getUses('c',uses_line_1, data_1.slice());
describe('The data flow analayzer', () => {
    it('is getting the definitions right', () => {
        assert.equal(def_1[0].id, 'c');
        assert.equal(def_1[0].loc.start.line, 7);
        assert.equal(def_1[0].loc.start.column, 8);
        assert.equal(def_1[0].Value, ' c  +  5 ');
    });
});

describe('The data flow analayzer', () => {
    it('is getting exactly 2 uses', () => {
        assert.equal(uses_1.length, 2);
    });
    it('is getting the definition use right', () => {
        assert.equal(uses_1[0].id, 'c');
        assert.equal(uses_1[0].Value, '(  c  +  x  ) +  5 ' );
    });
    it('is getting the c_use right', () => {
        assert.equal(uses_1[1].id, 'c');
        assert.equal(uses_1[1].Value, null);
    });
});


var codeString_2 = `function foo(){
    let x=0;
    x=x+1;
}`;
var codeJson_2 = parseCode(codeString_2);
var data_2 = extractData(codeJson_2);
var line_2 = 2;
var use_line_2 = 3;
var def_2 = getDefinitions(line_2, data_2.slice())[0];
var use_2 = getUses('x',use_line_2, data_2.slice())[1];

describe('The data flow analayzer', () => {
    it('is comoutes if a path is feasible', () => {
        assert.equal(isFeasible(def_2.loc, use_2.loc, codeString_2), true);
    });
});

var codeString_3 = `function foo(){
    {let x=0;}
    {x=x+1;}
}`;
var codeJson_3 = parseCode(codeString_3);
var data_3 = extractData(codeJson_3);
var line_3 = 2;
var use_line_3 = 3;
var def_3 = getDefinitions(line_3, data_3.slice())[0];
var use_3 = getUses('x',use_line_3, data_3.slice())[1];

describe('The data flow analayzer', () => {
    it('is comoutes if a path is feasible', () => {
        assert.equal(isFeasible(def_3.loc, use_3.loc, codeString_3), false);
    });
});

var codeString_4 = `function foo(){
    let x=0;
    x=x+1;
}`;
var codeJson_4 = parseCode(codeString_4);
var data_4 = extractData(codeJson_4);
var line_4 = 2;
var def_4 = getDefinitions(line_4, data_4.slice())[0];
var dcps_4 = findDCPs(def_4, data_4, codeString_4);

describe('The data flow analayzer', () => {
    it('is finding  def clear path in a simple function', () => {
        assert.equal(dcps_4[0].def.id, 'x');
        assert.equal(dcps_4[0].def.Value, '0');
        assert.equal(dcps_4[0].def.loc.start.line, 2);
        assert.equal(dcps_4[0].node.id, 'x');
        assert.equal(dcps_4[0].node.loc.start.line, 3);
        assert.equal(dcps_4[0].node.loc.start.column, 4);
    });
});