# =============================================
# -- PHASE 1 :  build typescript projects
# =============================================
FROM node:18.12.1 as buildstage

# -----------------------
# VISUALISER
# -----------------------
WORKDIR /visualiser
# COPY ./visualiser/package*.json ./
COPY ./visualiser/ .
RUN npm i
# RUN export VITE_BUILD_DATE=$(date +%Y-%m-%dT%H:%M:%S)
RUN export VITE_BUILD_DATE=$(date +%Y-%m-%dT%H:%M:%S) && npm run build

# -----------------------
# API
# -----------------------
# 2. build api
# WORKDIR /api
# # 2.1. copy app files, install dependencies and then builds the project
# COPY ./api/ .
# RUN npm i

# =============================================
# -- PHASE 2 :  copy build then run 
#               all apps to serve in ubuntu 
#               for all in one docker
# =============================================
FROM ubuntu:20.04
ARG DEBIAN_FRONTEND=noninteractive

# JAVA
RUN apt-get update && apt-get install -y default-jre curl apt-utils

# NODEJS
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash
RUN apt-get install -y nodejs

# NGINX
RUN apt update
RUN apt install -y nginx

WORKDIR /sda

# -----------------------
# VISUALISER
# -----------------------
COPY --from=buildstage /visualiser/build/ /usr/share/nginx/html

# -----------------------
# API
# -----------------------
# Build API 
COPY ./api/ ./api
WORKDIR /sda/api
RUN npm i
RUN npm run build
WORKDIR /sda/

# -----------------------
# SCIENCE
# -----------------------
COPY science/ ./science


# -----------------------
# SCIENCE API
# -----------------------
WORKDIR /sda/science-api

RUN apt update
RUN apt install -y software-properties-common
RUN add-apt-repository ppa:deadsnakes/ppa
RUN apt-get update
RUN apt update
RUN apt install -y python3.8 python3.8-venv python-is-python3 python3-pip
RUN python --version
RUN python -m pip --version

# PIP INSTALLS
COPY ./science-api/requirements.txt  ./requirements.txt
RUN pip install -r ./requirements.txt

# COPY ALL FILES
COPY ./science-api/ .


WORKDIR /sda

# COPY CONF
COPY ./_prod/nginx.conf /etc/nginx/nginx.conf
# COPY The htaccess
COPY ./_prod/default.conf /etc/nginx/conf.d/default.conf


COPY entrypoint.sh .
ENTRYPOINT './entrypoint.sh'
