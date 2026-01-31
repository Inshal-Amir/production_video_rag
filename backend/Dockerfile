# UPDATE: Using Python 3.11 to match your local Mac version
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for OpenCV
# We use 'libgl1' because 'libgl1-mesa-glx' is deprecated in this OS version
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the app code
COPY . .

# Run FastAPI
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]