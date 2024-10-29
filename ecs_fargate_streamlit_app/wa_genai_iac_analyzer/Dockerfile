# syntax=docker/dockerfile:1.4
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt ./requirements.txt
RUN pip3 install --no-cache-dir -r requirements.txt
EXPOSE 8501
COPY . .
ENTRYPOINT ["streamlit", "run", "wa_genai_iac_analyzer.py", "--server.port=8501", "--server.address=0.0.0.0"]
