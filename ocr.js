/*!
 * OCR.js
 *
 * Copyright 2020 yellow-streritzia
 */ 

// after DOM contents are loaded
window.addEventListener( "DOMContentLoaded", function() {
  // setup 

  // Select File
  const actionClickSelectFile = ( event ) => {
    let inputSelectFile = document.getElementById( "select-file-input" ); 
    let previewcanvas = document.getElementById( "preview-canvas" ); 
    let resultcanvas = document.getElementById( "result-canvas" ); 
    const previewctx = previewcanvas.getContext( "2d" );
    const resultctx = resultcanvas.getContext( "2d" );
    previewcanvas.style.display = "block";  

    if (inputSelectFile.files.length > 0) {
      let file = inputSelectFile.files[0];
      let reader = new FileReader();
      let image = new Image();
      reader.onload = function( evt ) {
        image.onload = function() {
          previewctx.drawImage( image, 0, 0, previewcanvas.width, previewcanvas.height ); 
          resultcanvas.width = image.width;
          resultcanvas.height = image.height;
          resultctx.drawImage( image, 0, 0 ); 
        }
        image.src = evt.target.result;
      }
      reader.readAsDataURL( file );
    }    
  };
  let inputSelectFile = document.getElementById( "select-file-input" ); 
  inputSelectFile.addEventListener( "change", actionClickSelectFile, false );

  // Select File button
  let btnSelectFile = document.getElementById( "select-file" ); 
  btnSelectFile.addEventListener( "click", function( event ) {
    let inputSelectFile = document.getElementById( "select-file-input" );
    inputSelectFile.click();
  }, false );

  // Recognize texts by OCR
  const recognizeCapture = async ( event ) => {
    let direction = document.getElementById( "detect-direction" );
    const direction_value = direction.options[direction.selectedIndex].value;
    let canvas = document.getElementById( "result-canvas" );
    const canvas_image = canvas.toDataURL("image/png");
 
    // call Web API , OCR
    const echo_res = await fetch('/echo');
    const result_echo = await echo_res.data;

    const fetch_recognize_res = await fetch('/recognize', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json'},
      body: JSON.stringify({data: canvas_image, direction: direction_value})
    });
    
    const result_recognize_json = await fetch_recognize_res.json()
    if(result_recognize_json['status'] == 'error'){ //Flask側で"error"と判断されたらアラートする
      alert('failed to post OCR request');
    }
    
    const orc_request_id = result_recognize_json['requestid'];
    let ocr_result = '未認識';    
    let params = new URLSearchParams();
    params.set('requestid', orc_request_id);
    for (let i = 0;  i < 10;  i++) {
      const echo_res = await fetch('/result?'+ params.toString())
      const result_result = await echo_res.json()
      if ( 'result' in result_result && 
           'status' in result_result &&
           result_result['status'] == 'success') {
        ocr_result = result_result['result']
        break;
      }
      await new Promise(r => setTimeout(r,2000));
    }
    
    afterPostRecognize(ocr_result);
  }

  const afterPostRecognize = async ( result ) => {
    let target = document.getElementById( "resultArea" );
    // check recognition result
    let ocrresult = result.replace(/ /g,"");  // current hack, captured result often include unexpected space.
    if ( ocrresult.length === 0 ) {
      target.value = "文字を認識できませんでした";
      await new Promise(r => setTimeout(r,2000));
    }

    target.innerHTML = ocrresult;
  }

  let btnRecognize = document.getElementById( "recognize" );
  btnRecognize.addEventListener( "click", recognizeCapture );
});


