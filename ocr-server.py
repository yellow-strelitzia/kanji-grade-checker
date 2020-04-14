import pytesseract
import shutil
import threading
import os
import time
import datetime
import io
import re
import random
import base64
import uuid
import queue
import traceback
from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS, cross_origin

try:
    from PIL import Image
except ImportError:
    import Image

app = Flask(__name__)
CORS(app)

#Queue for process OCR
ocr_queue = queue.Queue()
#Dict for result OCR
result_dict = dict()

def ocr_worker():
    while True:
        # process ocr request
        if not ocr_queue.empty():
            ocr_request = ocr_queue.get()
            print('found queue')
            if 'id' in ocr_request:
                print('process:' + ocr_request['id'])
                try:
                    extractedInformation = pytesseract.image_to_string(Image.open(io.BytesIO(ocr_request['image'])),
                                                                       lang=ocr_request['lang'], 
                                                                       config=ocr_request['config'])
                    result_dict[ocr_request['id']] = {'result': extractedInformation,
                                                     'time': datetime.datetime.now(),
                                                     'error': None }
                    print('success:' + ocr_request['id'])
                except Exception as e:
                    result_dict[ocr_request['id']] = {'result': None,
                                                     'time': datetime.datetime.now(),
                                                     'error': traceback.format_exc() }
                    print('failure:' + ocr_request['id'])
        # clean up old results
        for key in list(result_dict.keys()):
            result_time = result_dict[key]['time']
            if (datetime.datetime.now() - result_time).total_seconds() > 300:
                del result_dict[key]
                print('result of request id[' + key + '] now removed')

        time.sleep(0.1)

ocr_thread = threading.Thread(target=ocr_worker)
ocr_thread.start()

@app.route('/')
def root_html():
    return send_from_directory(os.path.abspath(os.path.dirname(__file__)),'ocr.html')

@app.route('/ocr.js')
def root_js():
    return send_from_directory(os.path.abspath(os.path.dirname(__file__)),'ocr.js')

@app.route('/echo')
@cross_origin(origin='*')
def process_echo():
    return 'ack'

@app.route('/recognize', methods=['POST'])
@cross_origin(origin='*')
def process_ocr():
    try:
        #extract true base64 image data
        stripped_data = re.sub('^data:image/.+;base64,', '', request.json['data'])
        config_value = '--psm 6'
        lang_value = 'jpn'
        if 'direction' in request.json:
            if request.json['direction'] == 'vertical':
                config_value = '--psm 5'
                lang_value = 'jpn_vert'
        decoded_image = base64.b64decode(stripped_data)
        
        ocr_request_id = 'ocr_recognize_id-' + str(uuid.uuid4())

        print('request id:' + ocr_request_id + ' created')

        ocr_queue.put({'id': ocr_request_id,
                       'image': decoded_image, 
                       'config': config_value,
                       'lang': lang_value})

        return jsonify({'status': 'success',
                        'requestid': ocr_request_id})

    except Exception as e:
        return jsonify({'status': 'error',
                        'requestid': None})        

@app.route('/result')
@cross_origin(origin='*')
def process_result():
    id = request.args['requestid']
    if id in result_dict:
        if result_dict[id]['result'] is not None:
            return jsonify({'status': 'success',
                        'message': '',
                        'result': result_dict[id]['result']})
        else:
            return jsonify({'status': 'error',
                        'message': result_dict[id]['error'],
                        'result': None})
    else:
            return jsonify({'status': 'not found'})

# Bind to PORT if defined, otherwise default to 5000.
port = int(os.environ.get('PORT', 5000))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=port, threaded=True)
