# DEPRECATED: This is a legacy variables file.
# This file is kept for backward compatibility but should not be used directly.
# 
# Use the environment-specific Terraform configurations instead:
#   - infra/terraform/envs/staging/ for staging deployments
#   - infra/terraform/envs/prod/     for production deployments

variable "subscription_id" {
  description = "Azure subscription ID (optional; prefer ARM_SUBSCRIPTION_ID env var / OIDC context)."
  type        = string
  default     = null
}

variable "tenant_id" {
  description = "Azure tenant ID (optional; prefer ARM_TENANT_ID env var / OIDC context)."
  type        = string
  default     = null
}

variable "client_id" {
  description = "Azure client ID (optional; prefer ARM_CLIENT_ID env var / OIDC context)."
  type        = string
  default     = null
}
