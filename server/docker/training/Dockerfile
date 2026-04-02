FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python libraries
RUN pip install --no-cache-dir \
    numpy \
    pandas \
    scikit-learn \
    requests \
    tabulate

# Create data and output directories
RUN mkdir /data /outputs

# Entry point will be the python script
ENTRYPOINT ["python"]
