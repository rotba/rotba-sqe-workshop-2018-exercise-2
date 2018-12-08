import assert from 'assert';
import {parseCode} from '../src/js/code-analyzer';
import {extractData} from '../src/js/code-analyzer';
import {findDCPs} from '../src/js/dataflow-analyzer';
import {getDefinitions} from '../src/js/dataflow-analyzer';

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
var line_1 = 7;
var def_1 = getDefinitions(line_1, data_1);
describe('The data flow analayzer', () => {
    it('is finding  def clear path in a simple function', () => {
        assert.equal(def_1.id, 'c');
        assert.equal(def_1.loc.line, 7);
        assert.equal(def_1.loc.col, 9);
        assert.equal(def_1.value, 'c + 5');
    });
});

var codeString_2 = `function foo(){
    let x=0;
    x=x+1;
}`;
var codeJson_2 = parseCode(codeString_2);
var data_2 = extractData(codeJson_2);
var line_2 = 2;
var def_2 = getDefinitions(line_2, data_2);
var dcps_2 = findDCPs(line_2, def_2 ,data_2);
describe('The data flow analayzer', () => {
    it('is finding  def clear path in a simple function', () => {
        assert.equal(dcps_2[0].definition.id, 'x');
        assert.equal(dcps_2[0].definition.val, '0');
        assert.equal(dcps_2[0].definition.line, '2');
        assert.equal(dcps_2[0].node.id, 'x');
        assert.equal(dcps_2[0].node.id, '3');
    });
});