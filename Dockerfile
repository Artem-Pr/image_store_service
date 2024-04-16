FROM node:16-alpine3.16

WORKDIR /app
COPY package*.json .

RUN apk add --no-cache \
        build-base \
        glib-dev \
        jpeg-dev \
        libexif-dev \
        libpng-dev \
        libwebp-dev \
        tiff-dev \
        giflib-dev \
        librsvg-dev \
        orc-dev \
        libheif-dev \
        vips-dev \
        perl-image-exiftool

RUN npm install
COPY . .

RUN npm run build

EXPOSE 3005

# ENTRYPOINT ["npm", "run", "build"]
ENTRYPOINT ["npm", "run", "prod"]
