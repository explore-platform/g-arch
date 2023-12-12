FROM ubuntu:20.04

WORKDIR /sda/science-api

# ==============================================
# INSTALLS
# ==============================================
RUN apt update
RUN apt install -y software-properties-common
RUN add-apt-repository ppa:deadsnakes/ppa
RUN apt-get update
RUN apt update
RUN apt install -y python3.8 python3.8-venv python-is-python3 python3-pip curl nginx
RUN python --version
RUN python -m pip --version

# ==============================================
# PIP INSTALLS (fast docker build)
# ==============================================
COPY ./science-api/requirements.txt  ./requirements.txt
RUN pip install -r ./requirements.txt

# ==============================================
# COPY ALL FILES
# ==============================================
COPY ./science-api/ .

# ==============================================
# ENTRYPOINT
# ==============================================
ENTRYPOINT bash -c "uvicorn app:app --reload --host 0.0.0.0 --port 5000"