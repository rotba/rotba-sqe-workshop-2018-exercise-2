var data = [];

function storeData(data_array){
    data = data_array;
}

//Function that returns the data
const getData = () => {
    return data;
};


export {storeData};
export {getData};
