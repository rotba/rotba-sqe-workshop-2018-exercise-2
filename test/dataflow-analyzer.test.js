import assert from 'assert';
import {parseCode} from '../src/js/code-analyzer';
import {extractData} from '../src/js/code-analyzer';
import {findDCPs} from '../src/js/dataflow-analyzer';
import {getDefinitions} from '../src/js/dataflow-analyzer';
import {getGlobalDefs} from '../src/js/dataflow-analyzer';
import {getUses} from '../src/js/dataflow-analyzer';
import {isFeasible} from '../src/js/dataflow-analyzer';
import {substituteData} from '../src/js/dataflow-analyzer';
import {substituteCode} from '../src/js/dataflow-analyzer';
import {getInputVector} from '../src/js/dataflow-analyzer';


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
        assert.equal(def_1[0].Value, '  c   +  5 ');
    });
});

describe('The data flow analayzer', () => {
    it('is getting exactly 2 uses', () => {
        assert.equal(uses_1.length, 2);
    });
    it('is getting the definition use right', () => {
        assert.equal(uses_1[0].id, 'c');
        assert.equal(uses_1[0].Value, '(   c   +   x   ) +  5 ' );
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


var codeString_5 = `function foo(x){
    let a = x + 1;
    if (a < x) {
        a = a + 5;
        return a;
    }
}
`;
var codeJson_5 = parseCode(codeString_5);
var data_5 = extractData(codeJson_5);
var glbl_feds_5 = getGlobalDefs(data_5, codeString_5);
describe('The data flow analayzer', () => {
    it('is extracting the global defs properly', () => {
        assert.equal(glbl_feds_5.length, 3);
        assert.equal(glbl_feds_5[0].node.id, 'a');
        assert.equal(glbl_feds_5[2].node.id, 'a');
        assert.equal(glbl_feds_5[0].def.Value, '  x   +  1 ');
        assert.equal(glbl_feds_5[2].def.Value, '  a   +  5 ');
    });
});

var codeString_6 = `function foo(x){
    let a = x + 1;
    return a;
}
`;

var codeJson_6 = parseCode(codeString_6);
var data_6 = extractData(codeJson_6);
var glbl_feds_6 = getGlobalDefs(data_6, codeString_6);
var data_sub_6 = substituteData(glbl_feds_6,data_6);
var substituted_a = data_sub_6[3].Value;

describe('The data flow analayzer', () => {
    it('is substituting properly', () => {
        assert.equal(substituted_a, 'x + 1');
    });
});



var codeString_7 = `function foo(x){
    let a = x + 1;
    return a;
}
`;
var expected_7 = 'function foo(x){\n' +
    '    return x + 1;\n' +
    '}';

var codeJson_7 = parseCode(codeString_7);
var data_7 = extractData(codeJson_7);
var glbl_feds_7 = getGlobalDefs(data_7, codeString_7);
var data_sub_7 = substituteData(glbl_feds_7,data_7);
var res_7 = substituteCode(codeString_7, data_sub_7, getInputVector(data_sub_7, '1'));


describe('The data flow analayzer', () => {
    it('is substituting properly', () => {
        assert.equal(res_7, expected_7);
    });
});
var codeString_8 =
`function foo(x){
    let a = x + 1;
    if(a<x){
        return a+x;
    }
}
`;
var expected_8 = 'function foo(x){\n' +
    '    if(x + 1 < x) {\n' +
    '        return x + 1 + x;\n' +
    '    }\n' +
    '}';

var codeJson_8 = parseCode(codeString_8);
var data_8 = extractData(codeJson_8);
var glbl_feds_8 = getGlobalDefs(data_8, codeString_8);
var data_sub_8 = substituteData(glbl_feds_8,data_8);
var res_8 = substituteCode(codeString_8, data_sub_8, getInputVector(data_sub_8, '1'));

describe('The data flow analayzer', () => {
    it('is substituting properly', () => {
        assert.equal(res_8, expected_8);
    });
});
var codeString_9 =
    `function foo(x){
    let a = x + 1;
    if(a<x){
        return a+x;
    }
    return a;
}
`;

var codeJson_9 = parseCode(codeString_9);
var data_9 = extractData(codeJson_9);
var glbl_feds_9 = getGlobalDefs(data_9, codeString_9);

describe('The data flow analayzer', () => {
    it('is finding global defs properly', () => {
        assert.equal(glbl_feds_9[2].node.id, 'a');
        assert.equal(glbl_feds_9[2].def.Value, '  x   +  1 ');
    });
});

var codeString_10 =
`function foo(x){
    let a = x + 1;
    if (a < x) {
        return x + a;
    } else {
        return x*a;
    }
}`;
var expected_10 =
    'function foo(x){\n' +
    '    if(x + 1 < x) {\n' +
    '        return x + (x + 1);\n' +
    '    } else {\n' +
    '        return x * (x + 1);\n' +
    '    }\n' +
    '}';

var codeJson_10 = parseCode(codeString_10);
var data_10 = extractData(codeJson_10);
var glbl_feds_10 = getGlobalDefs(data_10, codeString_10);
var data_sub_10 = substituteData(glbl_feds_10,data_10);
var res_10 = substituteCode(codeString_10, data_sub_10,  getInputVector(data_sub_10, '1'));

describe('The data flow analayzer', () => {
    it('is substituting properly', () => {
        assert.equal(res_10, expected_10);
    });
});

var codeString_11 =
    `function foo(x){
    let a = x + 1;
    if (a < x) {
        return x + a;
    } else if( a < x){
        return x*a;
    }
}`;
var expected_11 =
    'function foo(x){\n' +
    '    if(x + 1 < x) {\n' +
    '        return x + (x + 1);\n' +
    '    } else if(x + 1 < x) {\n' +
    '        return x * (x + 1);\n' +
    '    }\n' +
    '}';

var codeJson_11 = parseCode(codeString_11);
var data_11 = extractData(codeJson_11);
var glbl_feds_11 = getGlobalDefs(data_11, codeString_11);
var data_sub_11 = substituteData(glbl_feds_11,data_11);
var res_11 = substituteCode(codeString_11, data_sub_11,  getInputVector(data_sub_11, '1'));

describe('The data flow analayzer', () => {
    it('is substituting properly', () => {
        assert.equal(res_11, expected_11);
    });
});

var codeString_12 =
`function foo(z){
    let b = z+1;
    while (b < z) {
        return b;
    }
    return z;
}
`;
var expected_12 =
    'function foo(z){\n' +
    '    while(z + 1 < z) {\n' +
    '        return z + 1;\n' +
    '    }\n'+
    '    return z;\n' +
    '}'

var codeJson_12 = parseCode(codeString_12);
var data_12 = extractData(codeJson_12);
var glbl_feds_12 = getGlobalDefs(data_12, codeString_12);
var data_sub_12 = substituteData(glbl_feds_12,data_12);
var res_12 = substituteCode(codeString_12, data_sub_12,  getInputVector(data_sub_12, '1'));

describe('The data flow analayzer', () => {
    it('is substituting properly while statement', () => {
        assert.equal(res_12, expected_12);
    });
});

var codeString_13 =
    `function foo(x, y, z){
    let a = x + 1;
    let b = a + y;
}
`;

var codeJson_13 = parseCode(codeString_13);
var data_13 = extractData(codeJson_13);
var glbl_feds_13 = getGlobalDefs(data_13, codeString_13);
var data_sub_13 = substituteData(glbl_feds_13,data_13);
var substituted_val_13 = data_sub_13[5];

describe('The data flow analayzer', () => {
    it('is substituting properly example 1', () => {
        assert.equal(substituted_val_13.Value, 'x + 1 + y');
    });
});

var codeString_14 =
    `function foo(x, y, z){
    let a = x + 1;
    let b = a + y;
    b = b + 1;
}
`;

var codeJson_14= parseCode(codeString_14);
var data_14= extractData(codeJson_14);
var glbl_feds_14= getGlobalDefs(data_14, codeString_14);
var data_sub_14= substituteData(glbl_feds_14,data_14);
var updatedGlobalDef_14 = glbl_feds_14[1].def;
describe('The data flow analayzer', () => {
    it('is substituting properly example 1', () => {
        assert.equal(updatedGlobalDef_14.Value, 'x + 1 + y');
    });
});

// var codeString_m1 =
//     `function foo(x, y, z){
//     let a = x + 1;
//     let b = a + y;
//     let c = 0;
//
//     if (b < z) {
//         c = c + 5;
//         return x + y + z + c;
//     } else if (b < z * 2) {
//         c = c + x + 5;
//         return x + y + z + c;
//     } else {
//         c = c + z + 5;
//         return x + y + z + c;
//     }
// }
// `;
// var expected_m1 =
//     'function foo(x, y, z){\n' +
//     '    if (x + 1 + y < z) {\n' +
//     '        return x + y + z + 5;\n' +
//     '    } else if (x + 1 + y < z * 2) {\n' +
//     '        return x + y + z + x + 5;\n' +
//     '    } else {\n' +
//     '        return x + y + z + z + 5;\n' +
//     '    }\n' +
//     '}\n';
//
//
// var codeJson_m1 = parseCode(codeString_m1);
// var data_m1 = extractData(codeJson_m1);
// var glbl_feds_m1 = getGlobalDefs(data_m1, codeString_m1);
// var data_sub_m1 = substituteData(glbl_feds_m1,data_m1);
// var res_m1 = substituteCode(codeString_m1, data_sub_m1);
// describe('The data flow analayzer', () => {
//     it('is substituting properly example 1', () => {
//         assert.equal(res_m1, expected_m1);
//     });
// });


var codeString_15 =
    `let w = 1;
    function foo(z){
    let a = w;
    return a;
}
`;

var expected_15 =
    'let w = 1;\n' +
    '    function foo(z){\n' +
    '    return w;\n' +
    '}'

var codeJson_15 = parseCode(codeString_15);
var data_15 = extractData(codeJson_15);
var glbl_feds_15 = getGlobalDefs(data_15, codeString_15);
var data_sub_15 = substituteData(glbl_feds_15,data_15);
var res_15 = substituteCode(codeString_15, data_sub_15, getInputVector(data_sub_15, '1'));

describe('The data flow analayzer', () => {
    it('is substituting properly while statement', () => {
        assert.equal(res_15, expected_15);
    });
});

var codeString_16 =
    `function foo(w){
    let a = w;
    w = a +1;
    return a;
}
`;

var expected_16 =
    'function foo(w){\n' +
    'w = w + 1;\n' +
    '    return w;\n' +
    '}'

var codeJson_16 = parseCode(codeString_16);
var data_16 = extractData(codeJson_16);
var glbl_feds_16 = getGlobalDefs(data_16, codeString_16);
var data_sub_16 = substituteData(glbl_feds_16,data_16);
var res_16 = substituteCode(codeString_16, data_sub_16, getInputVector(data_sub_16, '1'));
describe('The data flow analayzer', () => {
    it('is substituting properly while statement', () => {
        assert.equal(res_16, expected_16);
    });
});

var codeString_17 =
    `function foo(w){
    let a = w;
    w = a +1;
    return a;
}
let z = 1;
`;

var expected_17 =
    'function foo(w){\n' +
    'w = w + 1;\n' +
    '    return w;\n' +
    '}\n'+
    'let z = 1;';

var codeJson_17 = parseCode(codeString_17);
var data_17 = extractData(codeJson_17);
var glbl_feds_17 = getGlobalDefs(data_17, codeString_17);
var data_sub_17 = substituteData(glbl_feds_17,data_17);
var res_17 = substituteCode(codeString_17, data_sub_17, getInputVector(data_sub_17, '1'));
var codeString_18 =
    `function foo(x, y, z){
    let b = [6,5,5,5];
    b[0] = 1;
    if (b[0] < z) {
        return b[2];
    }
}
`;


describe('The data flow analayzer', () => {
    it('is substituting properly while statement', () => {
        assert.equal(res_17, expected_17);
    });
});

var expected_18 =
    'function foo(x, y, z){\n' +
    '    if(1 < z) {\n' +
    '        return 5;\n' +
    '    }\n' +
    '}';

var codeJson_18 = parseCode(codeString_18);
var data_18 = extractData(codeJson_18);
var glbl_feds_18 = getGlobalDefs(data_18, codeString_18);
var data_sub_18 = substituteData(glbl_feds_18,data_18);
var res_18 = substituteCode(codeString_18, data_sub_18, getInputVector(data_sub_18, '[1]'));
describe('The data flow analayzer', () => {
    it('is substituting properly while statement', () => {
        assert.equal(res_18, expected_18);
    });
});