FROM node:latest

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install fastify NOT NEEDED IF YOU HAVE IT IN YOUR package.json
# RUN npm install fastify --save

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY ./src ./src

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]