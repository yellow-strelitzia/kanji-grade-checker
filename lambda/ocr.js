const axios = require('axios');

exports.handler = async function(event, context, callback) {
  const url = 'http://yellow-strelitzia-ocr-server1.herokuapp.com/';
  let parameters = null;
  if ( event.httpMethod == 'GET' ){
    parameters = event.queryStringParameters;
    console.log('parameters is query');
  } else {
    parameters = JSON.parse(event.body);
    console.log('parameters is body');
  }

  if ( parameters.type == 'echo' ) {
    let axios_result = await axios.get(url + 'echo');
    callback(null, {
      statusCode: 200,
      body: axios_result.data
    });
    console.log('echo called'); 
  } else if ( parameters.type == 'recognize' ) {
    let axios_result = await axios.post(url + 'recognize', {
      data: parameters.data,
      direction: parameters.direction
    });
    console.log('recognize result > ' + axios_result.data.status);
    callback(null, {
      statusCode: 200,
      body: JSON.stringify(axios_result.data)
    });
  } else if ( parameters.type == 'result') {
    let axios_result = await axios.get(url + 'result', {
      params: {
        requestid: parameters.requestid
      }
    });
    callback(null, {
      statusCode: 200,
      body: JSON.stringify(axios_result.data)
    });
    console.log('result query status [' + 
                parameters.requestid + ']:' +
                axios_result.data.status);
  }
};