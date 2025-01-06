FROM node:18-alpine

WORKDIR /app

# Declare versions as ARG variables for easy updates
ARG LIBDE265_VERSION=1.0.15
ARG LIBHEIF_VERSION=1.19.5
ARG VIPS_VERSION=8.16.0

# Pass ARG values to ENV for later use
ENV LIBDE265_VERSION=$LIBDE265_VERSION
ENV LIBHEIF_VERSION=$LIBHEIF_VERSION
ENV VIPS_VERSION=$VIPS_VERSION
ENV LD_LIBRARY_PATH=/usr/local/lib:/usr/local/lib64:$LD_LIBRARY_PATH
ENV PKG_CONFIG_PATH=/usr/local/lib/pkgconfig:/usr/local/lib64/pkgconfig

# Install build tools and dependencies
RUN apk add --no-cache \
    build-base \
    python3 \
    libjpeg-turbo-dev \
    libpng-dev \
    glib-dev \
    expat-dev \
    nasm \
    gobject-introspection-dev \
    curl \
    bash \
    cmake \
    meson \
    git \
    autoconf \
    automake \
    libtool

# Install libwebp
RUN git clone https://chromium.googlesource.com/webm/libwebp && \
    cd libwebp && \
    ./autogen.sh && \
    ./configure && \
    make && \
    make install && \
    cd .. && rm -rf libwebp

# Install x265
RUN git clone https://bitbucket.org/multicoreware/x265_git.git && \
    cd x265_git && \
    cmake source && \
    make && \
    make install && \
    cd .. && rm -rf x265_git

# Install libde265
RUN curl -L https://github.com/strukturag/libde265/releases/download/v${LIBDE265_VERSION}/libde265-${LIBDE265_VERSION}.tar.gz | \
    tar zx && \
    cd libde265-${LIBDE265_VERSION} && \
    ./autogen.sh && \
    ./configure && \
    make && \
    make install && \
    cd .. && rm -rf libde265-${LIBDE265_VERSION}

# Install libheif
RUN curl -L https://github.com/strukturag/libheif/releases/download/v${LIBHEIF_VERSION}/libheif-${LIBHEIF_VERSION}.tar.gz | \
    tar zx && \
    cd libheif-${LIBHEIF_VERSION} && \
    mkdir build && \
    cd build && \
    cmake --preset=release-noplugins .. && \
    make && \
    make install && \
    cd ../.. && rm -rf libheif-${LIBHEIF_VERSION}

# Install vips
RUN curl -L https://github.com/libvips/libvips/releases/download/v${VIPS_VERSION}/vips-${VIPS_VERSION}.tar.xz | \
    tar -xJ && \
    cd vips-${VIPS_VERSION} && \
    meson setup build && \
    cd build && \
    meson compile && \
    meson test && \
    meson install && \
    cd ../.. && rm -rf vips-${VIPS_VERSION}

# Install Node.js dependencies
COPY package*.json .
RUN npm install --verbose

# Copy application files
COPY . .

# Build the application
RUN npm run build

EXPOSE 3005

# Set the command to run the production server
ENTRYPOINT ["npm", "run", "prod"]