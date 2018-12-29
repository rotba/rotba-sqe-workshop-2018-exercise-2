import $ from 'jquery';
import {parseCode} from './code-analyzer';
import {extractData} from './code-analyzer';
import {substituteData} from './dataflow-analyzer';
import {substituteCode} from './dataflow-analyzer';
import {getGlobalDefs} from './dataflow-analyzer';
import {getInputVector} from './dataflow-analyzer';
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
        var substitutedCode = substituteCode(codeToParse, substitutedData, getInputVector(substitutedData, $('#inputVector').val()));
        insertSubCode(substitutedCode, subTable, substitutedData, $('#inputVector').val());

    });
});



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
        let regex = new RegExp('([^\\d\\w]|\\b)' + var_string.replace('[', '\\[').replace(']', '\\]')  + '([^\\d\\w]|\\b)', 'g');
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
//export {attrNamesEnum};

