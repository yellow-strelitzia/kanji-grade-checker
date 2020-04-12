import pytesseract
import shutil
import os
import io
import re
import random
import base64
import traceback
from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS, cross_origin

try:
    from PIL import Image
except ImportError:
    import Image

app = Flask(__name__)
CORS(app)

# Bind to PORT if defined, otherwise default to 5000.
port = int(os.environ.get('PORT', 5000))

@app.route('/')
def root_html():
    return send_from_directory(os.path.abspath(os.path.dirname(__file__)),'ocr.html')

@app.route('/ocr.js')
def root_js():
    return send_from_directory(os.path.abspath(os.path.dirname(__file__)),'ocr.js')

@app.route('/echo')
def process_echo():
    return 'ack'

@app.route('/recognize', methods=['POST'])
@cross_origin(origin='*')
def process_ocr():
    try:
        stripped_data = re.sub('^data:image/.+;base64,', '', request.json['data'])
        config_value = '--psm 6'
        lang_value = 'jpn'
        if 'direction' in request.json:
            if request.json['direction'] == 'vertical':
                config_value = '--psm 5'
                lang_value = 'jpn_vert'
        decoded_image = base64.b64decode(stripped_data)
        extractedInformation = pytesseract.image_to_string(Image.open(io.BytesIO(decoded_image)),lang=lang_value, config=config_value)
        return jsonify({'status': 'true',
                        'message': '',
                        'result': extractedInformation})

    except Exception as e:
        return jsonify({'status': 'false',
                        'message': traceback.format_exc(),
                        'result': None})        

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=port)
