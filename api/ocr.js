const axios = require('axios');

module.exports = (req, res) => {
  const url = 'http://yellow-strelitzia-ocr-server1.herokuapp.com/';
  
  if ( Object.keys(req.query) > 0 ){
    const parameters = req.query;
  } else {
    const parameters = req.body;
  }

  if ( parameters.type == 'echo' ) {
    axios.get( url + 'echo' )
         .then( axios_result => {
           res.status(200).send(axios_result.data);
           console.log('echo called');           
    });
  } else if ( parameters.type == 'recognize' ) {
    axios.post( url + 'recognize', {
            data: parameters.data,
            direction: parameters.direction } )
         .then( axios_result => {
           res.status(200).json(axios_result.data);
           console.log('recognize result > ' + axios_result.data.status);
    });
  } else if ( parameters.type == 'result') {
    axios.get(url + 'result', {
            params: {
            data: parameters.requestid } )
         .then( axios_result => {
           res.status(200).json(axios_result.data);
           console.log('result extracted > ' + parameters.requestid );
    });
  }  
}