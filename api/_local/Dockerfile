FROM ubuntu:20.04
ARG DEBIAN_FRONTEND=noninteractive

# JAVA
RUN apt-get update && apt-get install -y default-jre curl apt-utils

# NODEJS
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash
RUN apt-get install -y nodejs

WORKDIR /sda/api/
ENTRYPOINT npm i && npm run dev