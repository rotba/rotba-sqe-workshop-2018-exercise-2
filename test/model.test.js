import assert from 'assert';
import {storeData} from '../src/js/model';
import {getData} from '../src/js/model';
import {extractData, parseCode} from '../src/js/code-analyzer';

var codeJson = parseCode('let a = 1;');
let data = extractData(codeJson);
storeData(data);
var varaiable_a;
for (var i = 0; i < data.length; i++) {
    if(data[i]['Name'] == 'a'){
        varaiable_a = data[i];
    }
}
let stored_data = getData();
describe('The mode;', () => {
    it('is storing correctly data', () => {
        assert.equal(stored_data.includes(varaiable_a), true);
    });

});


