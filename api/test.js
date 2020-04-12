const axios = require('axios');

module.exports = async (req, res) => {
  const url = 'http://yellow-strelitzia-ocr-server1.herokuapp.com/echo';
  let axios_result = await axios.get(url, {
    params: {
      id: 3144
    }
  });
  //res.status(200).send("A");
  res.status(200).json({message:"", status:"true", result: axios_result.data});
   
}