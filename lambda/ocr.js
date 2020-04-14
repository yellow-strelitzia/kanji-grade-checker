const axios = require('axios');

exports.handler = async function(event, context, callback) {
  const url = 'http://yellow-strelitzia-ocr-server1.herokuapp.com/';
  const parameters = JSON.parse(event.body);

  if ( parameters.type == 'echo' ) {
    let axios_result = await axios.get(url + 'echo');
    callback(null, {
      statusCode: 200,
      body: axios_result.data
    });
  } else if ( parameters.type == 'recognize' ) {
    const { data, direction } = JSON.parse(event.body);
    let axios_result = await axios.post(url + 'recognize', {
      data: parameters.data,
      direction: parameters.direction
    });
    console.log('recognize result > ' + axios_result.data);
    callback(null, {
      statusCode: 200,
      body: JSON.stringify(axios_result.data)
    });
  } else if ( parameters.type == 'result') {
    let axios_result = await axios.get(url + 'result', {
      params: {
        data: parameters.requestid
      }
    });
    callback(null, {
      statusCode: 200,
      body: JSON.stringify(axios_result.data)
    });    
  }
};