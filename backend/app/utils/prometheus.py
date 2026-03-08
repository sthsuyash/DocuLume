"""Prometheus metrics configuration."""

from prometheus_client import Counter, Histogram, Gauge, Info
import psutil
import time

# Application info
app_info = Info("chat_pdf_app", "Chat PDF application information")
app_info.info({
    "version": "2.0.0",
    "name": "Chat PDF RAG System"
})

# HTTP metrics
http_requests_total = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "status"]
)

http_request_duration_seconds = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "endpoint"]
)

# Document metrics
documents_uploaded_total = Counter(
    "documents_uploaded_total",
    "Total documents uploaded",
    ["user_id", "file_type"]
)

documents_processed_total = Counter(
    "documents_processed_total",
    "Total documents processed",
    ["status"]  # COMPLETED, FAILED
)

document_processing_duration_seconds = Histogram(
    "document_processing_duration_seconds",
    "Document processing duration in seconds",
    ["file_type"]
)

# Chat metrics
chat_requests_total = Counter(
    "chat_requests_total",
    "Total chat requests",
    ["user_id", "use_rag", "llm_provider"]
)

chat_response_duration_seconds = Histogram(
    "chat_response_duration_seconds",
    "Chat response generation duration in seconds",
    ["llm_provider", "use_rag"]
)

chat_tokens_used_total = Counter(
    "chat_tokens_used_total",
    "Total tokens used in chat",
    ["llm_provider", "type"]  # type: prompt, completion
)

# Vector store metrics
vector_store_operations_total = Counter(
    "vector_store_operations_total",
    "Total vector store operations",
    ["operation"]  # add, search, delete
)

vector_store_search_duration_seconds = Histogram(
    "vector_store_search_duration_seconds",
    "Vector store search duration in seconds"
)

# Database metrics
db_connections_active = Gauge(
    "db_connections_active",
    "Active database connections"
)

db_query_duration_seconds = Histogram(
    "db_query_duration_seconds",
    "Database query duration in seconds",
    ["query_type"]
)

# Cache metrics
cache_hits_total = Counter(
    "cache_hits_total",
    "Total cache hits",
    ["cache_key_type"]
)

cache_misses_total = Counter(
    "cache_misses_total",
    "Total cache misses",
    ["cache_key_type"]
)

# System metrics
system_cpu_usage = Gauge(
    "system_cpu_usage_percent",
    "System CPU usage percentage"
)

system_memory_usage = Gauge(
    "system_memory_usage_percent",
    "System memory usage percentage"
)

system_disk_usage = Gauge(
    "system_disk_usage_percent",
    "System disk usage percentage"
)

# Celery metrics
celery_tasks_total = Counter(
    "celery_tasks_total",
    "Total Celery tasks",
    ["task_name", "status"]  # SUCCESS, FAILURE, RETRY
)

celery_task_duration_seconds = Histogram(
    "celery_task_duration_seconds",
    "Celery task duration in seconds",
    ["task_name"]
)


def update_system_metrics():
    """Update system metrics."""
    try:
        system_cpu_usage.set(psutil.cpu_percent(interval=0.1))
        system_memory_usage.set(psutil.virtual_memory().percent)
        system_disk_usage.set(psutil.disk_usage('/').percent)
    except Exception:
        pass  # Ignore errors in metrics collection
