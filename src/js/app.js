import $ from 'jquery';
import {parseCode} from './code-analyzer';
import {extractData} from './code-analyzer';
import {substituteData} from './dataflow-analyzer';
import {substituteCode} from './dataflow-analyzer';
import {getGlobalDefs} from './dataflow-analyzer';
import {storeData} from './model';
var tableColsEnmt = Object.freeze({'Line':0, 'Type':1, 'Name':2, 'Condition':3, 'Value':4});

//var attrNamesEnum = Object.freeze({'Line':'Line', 'Type':'Type', 'Name':'Name', 'Condition':'Condition', 'Value':'Value'});

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let parsedCode = parseCode(codeToParse);
        let data_array = extractData(parsedCode);
        storeData(data_array);
        //var table = document.getElementById('myTable');
        var subTable = document.getElementById('subCodeTable');
        data_array.sort(function(a, b){return a['Line']-b['Line'];});
        var globalDefs = getGlobalDefs(data_array, codeToParse);
        var substitutedData = substituteData(globalDefs, data_array);
        var substitutedCode = substituteCode(codeToParse, substitutedData);
        //insertData(substitutedData, table);
        insertSubCode(substitutedCode, subTable, substitutedData, $('#inputVector').val());

    });
});


//Inserts the data to the html table
function insertData(data, table){
    for(var i =0; i < data.length; i++){
        var row = table.insertRow(i+1);
        var lineCell = row.insertCell(tableColsEnmt.Line);
        var typeCell = row.insertCell(tableColsEnmt.Type);
        var nameCell = row.insertCell(tableColsEnmt.Name);
        var conditionCell = row.insertCell(tableColsEnmt.Condition);
        var valueCell = row.insertCell(tableColsEnmt.Value);
        lineCell.innerHTML = data[i]['Line'];
        typeCell.innerHTML = data[i]['Type'];
        nameCell.innerHTML = data[i]['Name'];
        conditionCell.innerHTML = data[i]['Condition'];
        valueCell.innerHTML = data[i]['Value'];
    }
}


//Inserts the data to the html table
function insertSubCode(subCode, table, substitutedData, inputFromUser){
    var inputVector = getInputVector(substitutedData, inputFromUser);
    var codeArray = subCode.match(/[^\r\n]+/g);
    for(var i =0; i < codeArray.length; i++){
        var row = table.insertRow(i+1);
        var lineCell = row.insertCell(tableColsEnmt[' ']);
        lineCell.innerHTML = codeArray[i];
        paintRaw(lineCell,substitutedData,inputVector, i+1);
    }
}
function paintRaw(lineCell, substitutedData, inputVector, lineNum) {
    var elementToPaint = getElementToPaint(substitutedData,lineNum);
    if(elementToPaint != null){
        var cond  = elementToPaint.Condition;
        var value = evaluate(cond, inputVector);
        if(value){
            lineCell.className ='True';
        }else{
            lineCell.className ='False';
        }
    }
}

function evaluate(cond, inputVector) {
    for (let i = 0; i <inputVector.length ; i++) {
        var currElemnt = inputVector[i];
        var var_string = currElemnt.Name;
        let regex = new RegExp('[^\\d\\w]|' + var_string.replace('[', '\\[').replace(']', '\\]') + '|[^\\d\\w]', 'g')
        cond = cond.replace(regex, function (x) {
            return x.replace(var_string, currElemnt.Value);
        });
    }
    return eval(cond);
}


function getElementToPaint(substitutedData, lineNum) {
    var relevantElements = substitutedData.filter(e=> e.Line ==lineNum && (e.Type =='if statement' || e.Type =='else if statement' ||e.Type =='while statement' ));
    if(relevantElements.length ==0){
        return null;
    }else{
        return relevantElements[0];
    }
}

function getInputVector(substitutedData, inputFromUser) {
    var ans  = [];
    ans.push.apply(ans ,getGlobals(substitutedData));
    ans.push.apply(ans ,getParamsValues(substitutedData, inputFromUser));
    return ans;
}

function getGlobals(substitutedData) {
    var ans = [];
    for (let i = 0; i <substitutedData.length ; i++){
        var curr_element = substitutedData[i];
        if(curr_element.Type == 'function declaration'){
            return ans;
        }else if(curr_element.Type =='variable declaration'){
            ans.push(curr_element);
        }
    }
    return ans;
}

function getParamsValues(substitutedData, inputFromUser) {
    var ans = []
    if (/^\w+(,\w+)*$/.test(inputFromUser)) {
        var values = inputFromUser.split(',');
        var currValIndex = 0;
        for (let i = 0; i <substitutedData.length ; i++) {
            var currElement = substitutedData[i];
            if(currElement.Type == 'Param'){
                currElement.Value = values[currValIndex++];
                ans.push(currElement);
            }
        }
    }
    return ans;
}
//export {attrNamesEnum};

