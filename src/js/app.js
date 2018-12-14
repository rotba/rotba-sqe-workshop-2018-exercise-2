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
        var table = document.getElementById('myTable');
        data_array.sort(function(a, b){return a['Line']-b['Line'];});
        var globalDefs = getGlobalDefs(data_array, codeToParse);
        var substitutedData = substituteData(globalDefs, data_array);
        insertData(data_array, table);
        var substitutedCode = substituteCode(codeToParse, substitutedData);

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
//export {attrNamesEnum};

