/*!
 * Kanji Grade Checker
 *
 * Copyright 2019 yellow-streritzia
 */ 

let kanjiGradeUtil = {
  kanjiGradeMaster : null,
  kuromojiTokenizer : null,

  isKuromojiTokenizerAvailable : function() {
    return this.kuromojiTokenizer != null;
  },

  getKuromojiTokenizer : function() {
    let self = this;

    return new Promise( (resolve, reject) => {
      if ( this.kuromojiTokenizer === null ) {
        kuromoji.builder({ dicPath: "./kuromoji/dict" }).build(function (err, tokenizer) {
          // tokenizer is ready
          self.kuromojiTokenizer = tokenizer;
          resolve();
        });
      } else {
        resolve();
      }
    } );
  },

  katakanaToHiragana : function ( source ) {
    return source.replace(/[\u30a1-\u30f6]/g, function(match) {
      let chr = match.charCodeAt(0) - 0x60;
        return String.fromCharCode(chr);
    });
  },

  hiraganaToKatakana : function ( source ) {
    return source.replace(/[\u30a1-\u30f6]/g, function(match) {
      let chr = match.charCodeAt(0) + 0x60;
        return String.fromCharCode(chr);
    });
  },

  extractByTokenizedAndRubyAddedResult : function ( sourceText ) {
    if ( this.isKuromojiTokenizerAvailable() ) {
      let tokenizedResult = this.kuromojiTokenizer.tokenize( sourceText );
      let self = this;

      return tokenizedResult.reduce( function( accumulator, currentValue ) {
        if ( currentValue.pos === "記号" || currentValue.pos === "助詞" || 
             currentValue.pos === "助動詞" || 
             currentValue.word_type === "UNKNOWN" ) {
          accumulator = accumulator + currentValue.surface_form;
        } else if ( currentValue.surface_form === self.katakanaToHiragana( currentValue.reading ) ||
                    currentValue.surface_form === currentValue.reading ) {
          accumulator = accumulator + currentValue.surface_form;
        } else {
          accumulator = accumulator + "<ruby>" + currentValue.surface_form +
            "<rp>(</rp><rt>" + self.katakanaToHiragana( currentValue.reading ) + 
            "</rt><rp>)</rp></ruby>";
        }
        return accumulator;        
      }, "" );
    }
    return null;
  },

  loadKanjiGradeMaster : function( url ) {
    let self = this;
    fetch( url )
    .then( response => response.json() )
    .then( json => self.kanjiGradeMaster = json );
  },
  
  setGradeColor : function( grade, color ) {
    if ( this.kanjiGradeMaster === null ) {
      throw "master not found.";
    }
    if ( !this.kanjiGradeMaster.grade.includes( grade ) ) {
      throw "invalid parameter"
    }
    this.kanjiGradeMaster.grade_info[grade].color = color;
  },  
  
  getGradeColor : function( grade ) {
    if ( this.kanjiGradeMaster === null ) {
      throw "master not found.";
    }
    if ( !this.kanjiGradeMaster.grade.includes( grade ) ) {
      throw "invalid parameter"
    }
    return this.kanjiGradeMaster.grade_info[grade].color;
  },
    
  getGradeFromCharacter : function( character ) {
    if ( this.kanjiGradeMaster === null ) {
      throw "master not found.";
    }
    let gradeArrays = this.kanjiGradeMaster.kanji_grade_info[0].kanji_grade;
    var result = null;
    result = gradeArrays.e1.includes( character ) ? "e1" : result;
    if ( result == null ) 
      result = gradeArrays.e2.includes( character ) ? "e2" : result;
    if ( result == null ) 
      result = gradeArrays.e3.includes( character ) ? "e3" : result;
    if ( result == null ) 
      result = gradeArrays.e4.includes( character ) ? "e4" : result;
    if ( result == null ) 
      result = gradeArrays.e5.includes( character ) ? "e5" : result;
    if ( result == null ) 
      result = gradeArrays.e6.includes( character ) ? "e6" : result;
    return result;
  },

  extractReplaceForGrade : function ( sourceText ) {
    //let sourceArray = sourceText.split("");
    let sourceArray = sourceText.match( /[\uD800-\uDBFF][\uDC00-\uDFFF]|[\s\S]/g ) || [];
    let self = this;
    let extracted = sourceArray.reduce( function( accumulator, currentValue ) {
      let grade = self.getGradeFromCharacter( currentValue );
      if ( grade != null ) {
        accumulator[currentValue] = "<span class=\"grade-" + grade
          + " color-on grade-back-on toggle-color\">"
          + currentValue + "</span>";
      }
      return accumulator;        
    }, {} );
    return extracted;    
  },

  extractCheckedResult : function( sourceText ) {
    var resultOfTokenized = this.extractByTokenizedAndRubyAddedResult( sourceText );
    if ( resultOfTokenized === null ) {
      // even if extractByTokenizedAndRubyAddedResult failed, try to return 
      // kanji grade recognezed result
      resultOfTokenized = sourceText;
    }
    let replaceInfo = this.extractReplaceForGrade( sourceText );

    let resultArray = resultOfTokenized.match( /[\uD800-\uDBFF][\uDC00-\uDFFF]|[\s\S]/g ) || [];
    let self = this;
    return resultArray.reduce( function( accumulator, currentValue ) {
      if ( replaceInfo[currentValue] ) {
        accumulator = accumulator + replaceInfo[currentValue];
      } else {
        accumulator = accumulator + currentValue;
      }
      return accumulator;        
    }, "" );
  }
};

// after DOM contents are loaded
window.addEventListener( "DOMContentLoaded", function() {
  // setup 

  // reset grade button color
  const resetGradeButtonColor = () => {
    for (const toggleElement of document.getElementsByClassName("tobble-button-caption")) {
      toggleElement.classList.add("color-on");
    }
  };

  // Execute Click
  const actionClickExecuteCheck = async ( event ) => {
    console.log( "Execute button clicked." );
    let src = document.getElementById( "originalText" );
    let dest = document.getElementById( "resultArea" );

    if ( !kanjiGradeUtil.isKuromojiTokenizerAvailable() ) {
      let modalProgress = document.getElementById( "progress-modal" );
      let progressCaption = document.getElementById( "progress-caption" );
      progressCaption.innerHTML = "フリガナ処理を初期化しています";
      modalProgress.classList.toggle('is-active');
      await kanjiGradeUtil.getKuromojiTokenizer();
      modalProgress.classList.toggle('is-active');
    }
    resetGradeButtonColor();
    dest.innerHTML = kanjiGradeUtil.extractCheckedResult( src.value );  
  };
  let btnExecCheck = document.getElementById( "buttonExecCheck" ); 
  btnExecCheck.addEventListener( "click", actionClickExecuteCheck, false );

  // Start Camera
  const actionClickStartCamera = ( event ) => {
    let video = document.getElementById( "video-camera" );
    let previewcanvas = document.getElementById( "preview-canvas" );
    video.style.display = "block";
    previewcanvas.style.display = "none";
    //setting of camera
    const constraints = {
      audio: false,
      video: {
        width: { min: 800, ideal: 1080, max: 1920 },
        //facingMode: "user"   // front
        facingMode: "environment"
        //facingMode: { exact: "environment" }  // rear
      }
    };
    //sync video
    navigator.mediaDevices.getUserMedia( constraints )
    .then( ( stream ) => {
      video.srcObject = stream;
      video.onloadedmetadata = ( e ) => {
        video.play();
      };
    })
    .catch( (err) => {
      console.log(err.name + ": " + err.message );
    });  
  };
  let btnStartCamera = document.getElementById( "start-camera" ); 
  btnStartCamera.addEventListener( "click", actionClickStartCamera, false );

  // Execute Capture
  const actionClickExecCapture = ( event ) => {
    let video = document.getElementById( "video-camera" );
    let soundeffect = document.getElementById( "capture-sound" );
    let previewcanvas = document.getElementById( "preview-canvas" ); 
    let resultcanvas = document.getElementById( "result-canvas" ); 
    const previewctx = previewcanvas.getContext( "2d" );
    const resultctx = resultcanvas.getContext( "2d" );

    video.pause();  //stop video
    soundeffect.play();      //play sound

    //put image to canvas
    previewctx.drawImage(video, 0, 0, previewcanvas.width, previewcanvas.height);
    resultcanvas.width = video.videoWidth;
    resultcanvas.height = video.videoHeight;
    resultctx.drawImage(video, 0, 0, resultcanvas.width, resultcanvas.height);

    video.style.display = "none";
    previewcanvas.style.display = "block";   
  };
  let btnCaptureCamera = document.getElementById( "capture-camera" ); 
  btnCaptureCamera.addEventListener( "click", actionClickExecCapture, false );

  // Select File
  const actionClickSelectFile = ( event ) => {
    let inputSelectFile = document.getElementById( "select-file-input" ); 
    let video = document.getElementById( "video-camera" );
    let previewcanvas = document.getElementById( "preview-canvas" ); 
    let resultcanvas = document.getElementById( "result-canvas" ); 
    const previewctx = previewcanvas.getContext( "2d" );
    const resultctx = resultcanvas.getContext( "2d" );
    video.style.display = "none";
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
  const recognizCapture = async ( event ) => {
    let canvas = document.getElementById( "result-canvas" );
    let modalCapture = document.getElementById( "camera-modal" );
    let modalProgress = document.getElementById( "progress-modal" );
    let progressCaption = document.getElementById( "progress-caption" );
    let direction = document.getElementById( "detect-direction" );
    const direction_value = direction.options[direction.selectedIndex].value;
    let localServer = document.getElementById( "local-server-flag" );
    let localServerFlag = localServer.checked;
    let ocrLanguage = "jpn";
    let ocrSegMode = 6;
    if ( direction_value == "vertical" ) {
      ocrLanguage = "jpn_vert";
      ocrSegMode = 5;
    }
    progressCaption.innerHTML = "画像から文字を認識しています";
 
    modalProgress.classList.toggle( "is-active" );
 　 
    let ocrresult = "未認識";

    if ( localServerFlag )
    {
      let url = "https://kanji-grade-checker.netlify.com/.netlify/functions/ocr";
      if ( document.location.host.indexOf('kanji-grade-checker.now.sh') != -1 ) {
        url = "https://kanji-grade-checker.now.sh/api/ocr";
      }
      const canvas_image = canvas.toDataURL("image/png");

      // echo for check ocr server activity
      let echoparams = new URLSearchParams();
      echoparams.set("type", "echo");
      const echo_res = await fetch(url + "?" + echoparams.toString());
      const result_echo = await echo_res.data;

      const fetch_recognize_res = await fetch(url, {
        method: "POST",
        headers: { "Accept": "application/json", "Content-Type": "application/json"},
        body: JSON.stringify({"type": "recognize",
                              "data": canvas_image, 
                              "direction": direction_value})
      });
      const result_recognize_json = await fetch_recognize_res.json();
      if(result_recognize_json["status"] == "error"){ //WEBAPI側で"error"と判断されたらアラートする
        alert("failed to post OCR request");
      }

      const orc_request_id = result_recognize_json['requestid']; 
      let resultparams = new URLSearchParams();
      resultparams.set("type", "result");
      resultparams.set("requestid", orc_request_id);
      for (let i = 0;  i < 30;  i++) {
        const echo_res = await fetch(url + '?' + resultparams.toString())
        const result_result = await echo_res.json()
        if ( "result" in result_result && 
             "status" in result_result &&
             result_result["status"] == "success") {
          ocrresult = result_result['result']
          break;
        }
        await new Promise(r => setTimeout(r,1500));
      }
    } else {
      const { data: { text } } = await Tesseract.recognize(canvas, ocrLanguage, {
          tessedit_char_blacklist : "e",
          tessedit_pageseg_mode : ocrSegMode,
          preserve_interword_spaces : 0
      });
      // check recognition result
      ocrresult = text.replace(/ /g,"");  // current hack, captured result often include unexpected space.
      if ( ocr_result.length === 0 ) {
        progressCaption.innerHTML = "文字を認識できませんでした";
        await new Promise(r => setTimeout(r,2000));
      }
      else {
        modalCapture.classList.toggle( "is-active" );
      }
    }

    modalProgress.classList.toggle( "is-active" );

    let target = document.getElementById( "originalText" );
    target.value = ocrresult;
  };
  let btnRecognizeCapture = document.getElementById( "recognize-capture" );
  btnRecognizeCapture.addEventListener( "click", recognizCapture );

  // warn server API useage
  const actionCheckLocalServer = ( event ) => {
    let checkLocalServer = document.getElementById( "local-server-flag" );
    if ( checkLocalServer.checked ) {
      alert("alert");
    }
  };
  let checkLocalServer = document.getElementById( "local-server-flag" );
  checkLocalServer.addEventListener( "change", actionCheckLocalServer );

  // global utility setup
  kanjiGradeUtil.loadKanjiGradeMaster( "kanji_grade_info.json" );
  //kanjiGradeUtil.getKuromojiTokenizer();

  // setup general event
  for (const element of document.getElementsByClassName("toggle-color-button")) {
    element.addEventListener( "click", ( event ) => {
      let flag = element.children[0].classList.contains("color-on");
      for (const toggleElement of document.getElementsByClassName("toggle-color")) {
        let gradeTarget = toggleElement.classList.contains( element.dataset.target );
        let buttonTarget = toggleElement.classList.contains( "tobble-button-caption" );
        if ( gradeTarget ) {
          if ( flag )
            toggleElement.classList.remove("color-on");
          else
            toggleElement.classList.add("color-on");
          if ( flag && !buttonTarget )
            toggleElement.classList.remove("grade-back-on");
          if ( !flag && !buttonTarget )
            toggleElement.classList.add("grade-back-on");
        }
      }
    } );
  }

  for (const element of document.querySelectorAll(".modal .close-modal, .show-modal")) {
    element.addEventListener( "click", ( event ) => {
        const modalId = element.dataset.target;
        const modal = document.getElementById( modalId );
        modal.classList.toggle( "is-active" );
    } );
  }

  for (const element of document.querySelectorAll('.stop-camera')) {
    element.addEventListener( "click", ( event ) => {
        const video = document.getElementById("video-camera");
        if ( video.srcObject != null )
        {
          video.srcObject.getTracks().forEach( track => track.stop() );
          video.srcObject = null;
        }
    } );
  }  

});


