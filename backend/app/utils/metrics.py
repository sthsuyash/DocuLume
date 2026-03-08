"""Application metrics collection."""

from typing import Dict, Any
from datetime import datetime
import psutil
import os


class MetricsCollector:
    """Collect application metrics."""

    def __init__(self):
        self.process = psutil.Process(os.getpid())
        self.start_time = datetime.utcnow()

    def get_system_metrics(self) -> Dict[str, Any]:
        """Get system-level metrics."""
        return {
            "cpu": {
                "percent": psutil.cpu_percent(interval=1),
                "count": psutil.cpu_count(),
            },
            "memory": {
                "total_mb": round(psutil.virtual_memory().total / 1024 / 1024, 2),
                "available_mb": round(psutil.virtual_memory().available / 1024 / 1024, 2),
                "percent": psutil.virtual_memory().percent,
            },
            "disk": {
                "total_gb": round(psutil.disk_usage('/').total / 1024 / 1024 / 1024, 2),
                "used_gb": round(psutil.disk_usage('/').used / 1024 / 1024 / 1024, 2),
                "percent": psutil.disk_usage('/').percent,
            },
        }

    def get_process_metrics(self) -> Dict[str, Any]:
        """Get process-level metrics."""
        memory_info = self.process.memory_info()
        return {
            "pid": self.process.pid,
            "cpu_percent": self.process.cpu_percent(interval=1),
            "memory_mb": round(memory_info.rss / 1024 / 1024, 2),
            "threads": self.process.num_threads(),
            "open_files": len(self.process.open_files()),
        }

    def get_app_metrics(self) -> Dict[str, Any]:
        """Get application-level metrics."""
        uptime = datetime.utcnow() - self.start_time
        return {
            "uptime_seconds": int(uptime.total_seconds()),
            "start_time": self.start_time.isoformat(),
        }

    def get_all_metrics(self) -> Dict[str, Any]:
        """Get all metrics."""
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "system": self.get_system_metrics(),
            "process": self.get_process_metrics(),
            "application": self.get_app_metrics(),
        }


# Global metrics collector instance
metrics_collector = MetricsCollector()
