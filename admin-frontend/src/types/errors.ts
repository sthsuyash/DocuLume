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
