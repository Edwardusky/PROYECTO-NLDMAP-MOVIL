FROM node:22-bookworm

#Esta linea evita preguntas interactivas durante instalaciones
ENV DEBIAN_FRONTEND=noninteractive 

#Herramientas necesarias para el desarrollo
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    unzip \
    ca-certificates \
    openssh-client \
    libnspr4 \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libgtk-3-0 \
    && rm -rf /var/lib/apt/lists/*

#Directorio de trabajo
WORKDIR /workspace

#Permisos para el usuario node
RUN chown -R node:node /workspace

# Herramienta utilizada por Expo para conexiones mediante tunnel
RUN npm install -g @expo/ngrok@^4.1.0

#Usaremos el usuario que brinda la imagen oficial de node para evitar problemas de permisos
USER node

#Verificar las herramientas principales 
RUN node -v && npm -v && git --version && curl --version && wget --version

CMD ["sleep","infinity"]

