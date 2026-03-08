# Custom ML models

Purpose: guidance for integrating custom models or model hosts with DocuLume.

Summary

- You may host specialized embedding or reranker models. Ensure compatibility with the vector store schema.
- Provide HTTP endpoints that accept embedding requests and return fixed-size vectors.

Validation

- Run sample embedding requests and verify dimensions and normalization match the vector store expectations.
