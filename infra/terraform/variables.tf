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
