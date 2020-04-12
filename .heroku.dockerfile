FROM python:slim-buster
WORKDIR /app
COPY . /app

RUN ["apt-get", "update"]
RUN ["apt-get", "-y", "install", "tesseract-ocr"]
RUN ["apt-get", "-y", "install", "tesseract-ocr-jpn"]
RUN ["apt-get", "-y", "install", "tesseract-ocr-jpn-vert"]
RUN ["apt-get", "-y", "install", "build-essential"]
RUN ["apt-get", "-y", "install", "zlib1g-dev"]
RUN ["apt-get", "-y", "install", "libjpeg-dev"]
RUN ["pip3", "install", "Flask", "pytesseract", "flask-cors"]

CMD python /app/ocr-server.py
