FROM ubuntu:18.04
ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y default-jre

WORKDIR matisse4

COPY matisseV4/ .

# DCR:
# - move data folders outside of the sda (both input and output)

RUN chmod uao+x run4d.sh

CMD ['./run4d.sh']
