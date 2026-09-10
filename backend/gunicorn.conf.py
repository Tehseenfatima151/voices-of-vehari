import os

# Render dynamically assigns a PORT environment variable (e.g. 10000).
# Binding to 0.0.0.0:$PORT ensures Gunicorn listens on all network interfaces.
port = os.environ.get("PORT", "5000")
bind = f"0.0.0.0:{port}"

# Gunicorn process and worker configuration
# WEB_CONCURRENCY defaults to 2 workers for standard Render instances
workers = int(os.environ.get("WEB_CONCURRENCY", 2))
threads = int(os.environ.get("PYTHON_GET_THREADS", 2))
timeout = int(os.environ.get("TIMEOUT", 120))
keepalive = int(os.environ.get("KEEPALIVE", 5))
