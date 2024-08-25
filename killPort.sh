#!/bin/bash

# Define the port number
PORT=$1

# Find the process ID (PID) of the Python server running on the specified port
PID=$(lsof -t -i :$PORT)

if [[ -z $PID ]]; then
  echo "No Python server found running on port $PORT."
else
  # Terminate the server process
  echo "Killing Python server running on port $PORT (PID: $PID)..."
  kill $PID
fi
