const axios = require('axios');

module.exports = async (req, res) => {
  const url = 'http://yellow-strelitzia-ocr-server1.herokuapp.com/';
  const parameters = req.body;

  if ( parameters.type == 'echo' ) {
    let axios_result = await axios.get(url + 'echo');
    res.status(200).send(axios_result.data);
  } else if ( parameters.type == 'recognize' ) {
    const { data, direction } = JSON.parse(event.body);
    let axios_result = await axios.post(url + 'recognize', {
      data: parameters.data,
      direction: parameters.direction
    });
    console.log('recognize result > ' + axios_result.data);
    res.status(200).json(axios_result.data);
  } else if ( parameters.type == 'result') {
    let axios_result = await axios.get(url + 'result', {
      params: {
        data: parameters.requestid
      }
    });
    res.status(200).json(axios_result.data);  
  }  
}