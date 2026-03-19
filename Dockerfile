FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    mercurial \
    git \
    curl \
    wget \
    build-essential \
    libdbus-glib-1-dev \
    libgtk-3-dev \
    pkg-config \
    nasm \
    nodejs \
    unzip \
    && rm -rf /var/lib/apt/lists/*

RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

WORKDIR /mogwser
COPY . .

RUN chmod +x scripts/*.sh

CMD ["make", "setup"]
