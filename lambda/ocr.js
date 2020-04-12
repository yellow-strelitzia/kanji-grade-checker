const axios = require('axios');

exports.handler = async function(event, context, callback) {
  const url = 'http://yellow-strelitzia-ocr-server1.herokuapp.com/recognize';
  //const url = 'http://yellow-strelitzia-ocr-server1.herokuapp.com/echo';
  const { data, direction } = JSON.parse(event.body);
  console.log('data > ' + data );
  console.log('direction > ' + direction );
  let axios_result = await axios.post(url, {
    //params: {
      data: data,
      direction: direction
    //}
  });
  console.log('result > ' + axios_result.data);
  callback(null, {
    statusCode: 200,
    body: JSON.stringify(axios_result.data)//"Hello, World!"
  });
};