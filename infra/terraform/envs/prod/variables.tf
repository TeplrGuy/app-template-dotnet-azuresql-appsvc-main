variable "name_prefix" {
  description = "Name prefix for resources (should be globally unique where required)."
  type        = string
}

variable "location" {
  description = "Azure region (e.g., eastus2)."
  type        = string
  default     = "eastus2"
}

variable "tags" {
  description = "Additional resource tags."
  type        = map(string)
  default     = {}
}

variable "subscription_id" {
  description = "Azure subscription ID (optional; prefer env vars / OIDC context)."
  type        = string
  default     = null
}

variable "tenant_id" {
  description = "Azure tenant ID (optional; prefer env vars / OIDC context)."
  type        = string
  default     = null
}

variable "client_id" {
  description = "Azure client ID (optional; prefer env vars / OIDC context)."
  type        = string
  default     = null
}

variable "aad_admin_login" {
  description = "AAD admin display name for SQL Server."
  type        = string
  default     = "sqladmin"
}

variable "aad_admin_object_id" {
  description = "AAD admin object ID (user or group) for SQL Server."
  type        = string
  default     = ""
}
