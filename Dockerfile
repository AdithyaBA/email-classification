FROM node:latest
WORKDIR /app
TZ = "Asia/Kolkata"
RUN date
RUN wget http://download.redis.io/redis-stable.tar.gz && \
    tar xvzf redis-stable.tar.gz && \
    cd redis-stable && \
    make && \
    mv src/redis-server /usr/bin/ && \
    cd .. && \
    rm -r redis-stable && \
    npm install -g concurrently
#RUN npm install forever
#RUN npm install forever-monitor
COPY package*.json /app
RUN npm install
RUN npm install forever -g
COPY . .
EXPOSE 6379
CMD concurrently "/usr/bin/redis-server" "sleep 5s; forever index.js"