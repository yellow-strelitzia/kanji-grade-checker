FROM gitpod/workspace-full

RUN ["npm", "install", "-g", "http-server"]
RUN ["npm", "install", "-g", "now"]

USER root
RUN ["apt-get", "-y", "install", "tesseract-ocr"]
RUN ["apt-get", "-y", "install", "tesseract-ocr-jpn"]
RUN ["apt-get", "-y", "install", "tesseract-ocr-jpn-vert"]
RUN ["apt-get", "-y", "install", "build-essential"]
RUN ["apt-get", "-y", "install", "zlib1g-dev"]
RUN ["apt-get", "-y", "install", "libjpeg-dev"]
RUN ["pip3", "install", "Flask", "pytesseract", "flask-cors"]

RUN curl https://cli-assets.heroku.com/install.sh | sh
RUN chown -R gitpod:gitpod /home/gitpod/.cache/heroku

USER gitpod
