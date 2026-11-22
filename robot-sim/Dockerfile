FROM python:3.11-slim
WORKDIR /sim
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
CMD ["python", "verify_simulation.py"]
