const axios = require('axios');

module.exports = async (req, res) => {
  const url = 'http://yellow-strelitzia-ocr-server1.herokuapp.com/recognize';
  const { data, direction } = req.body;
  console.log('direction > ' + direction);
  let axios_result = await axios.post(url, {
    //params: {
      data: data,
      direction: direction
    //}
  });
  console.log('result > ' + axios_result.data);
  //res.status(200).send("A");
  res.status(200).json(axios_result.data);
   
}