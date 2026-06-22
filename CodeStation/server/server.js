// Entry point shim for backwards compatibility with existing startup scripts and PM2/Docker configurations.
// All modular backend architecture resides within the ./src directory.

require("./src/server");