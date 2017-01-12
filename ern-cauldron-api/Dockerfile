FROM node:6

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install

# Copy app source
COPY . /usr/src/app

# Expose cauldron-api server port
EXPOSE 3000

# Start cauldron-api server
CMD [ "npm", "start" ]
