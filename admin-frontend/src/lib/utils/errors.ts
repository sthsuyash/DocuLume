/**
 * RFC 7807 Problem Details error handling
 * https://datatracker.ietf.org/doc/html/rfc7807
 */

export interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  request_id?: string;
  timestamp?: string;
  errors?: Record<string, any>;
}

export interface ParsedError {
  title: string;
  message: string;
  status: number;
  requestId?: string;
  timestamp?: string;
  type?: string;
  validationErrors?: Record<string, any>;
}

/**
 * Check if an error response is RFC 7807 compliant
 */
export function isProblemDetail(error: any): error is ProblemDetail {
  return (
    error &&
    typeof error === "object" &&
    "type" in error &&
    "title" in error &&
    "status" in error &&
    "detail" in error
  );
}

/**
 * Parse error response from API
 */
export function parseApiError(error: any): ParsedError {
  // Axios error structure
  const response = error?.response;
  const data = response?.data;

  // RFC 7807 Problem Details
  if (isProblemDetail(data)) {
    return {
      title: data.title,
      message: data.detail,
      status: data.status,
      requestId: data.request_id,
      timestamp: data.timestamp,
      type: data.type,
      validationErrors: data.errors,
    };
  }

  // Legacy error format
  if (data?.detail) {
    return {
      title: "Error",
      message: typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail),
      status: response?.status || 500,
    };
  }

  // Network error
  if (error?.message === "Network Error") {
    return {
      title: "Network Error",
      message: "Unable to connect to the server. Please check your internet connection.",
      status: 0,
    };
  }

  // Timeout error
  if (error?.code === "ECONNABORTED") {
    return {
      title: "Request Timeout",
      message: "The request took too long to complete. Please try again.",
      status: 408,
    };
  }

  // Generic error
  return {
    title: "Error",
    message: error?.message || "An unexpected error occurred",
    status: response?.status || 500,
  };
}

/**
 * Get user-friendly error message from status code
 */
export function getStatusMessage(status: number): string {
  const messages: Record<number, string> = {
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    409: "Conflict",
    422: "Validation Error",
    429: "Too Many Requests",
    500: "Internal Server Error",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Gateway Timeout",
  };

  return messages[status] || "Error";
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors?: Record<string, any>): string[] {
  if (!errors) return [];

  return Object.entries(errors).map(([field, error]) => {
    const message = Array.isArray(error) ? error.join(", ") : String(error);
    return `${field}: ${message}`;
  });
}

/**
 * Get error severity level
 */
export function getErrorSeverity(status: number): "error" | "warning" | "info" {
  if (status >= 500) return "error";
  if (status >= 400) return "warning";
  return "info";
}
