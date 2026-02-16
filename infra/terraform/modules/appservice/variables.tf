variable "resource_group_name" {
  description = "Resource group name."
  type        = string
}

variable "location" {
  description = "Azure region (e.g., eastus2)."
  type        = string
}

variable "service_plan_name" {
  description = "App Service Plan name."
  type        = string
}

variable "backend_app_name" {
  description = "Backend API Web App name (globally unique)."
  type        = string
}

variable "frontend_app_name" {
  description = "Frontend Web App name (globally unique)."
  type        = string
}

variable "sku_name" {
  description = "App Service Plan SKU name (e.g., B1, S1, P1v3)."
  type        = string
  default     = "P0v3"
}

variable "always_on" {
  description = "Whether to keep the app always on."
  type        = bool
  default     = true
}

variable "acr_login_server" {
  description = "ACR login server URL (e.g., myacr.azurecr.io)."
  type        = string
}

variable "backend_image" {
  description = "Backend container image name (without registry)."
  type        = string
  default     = "backend:latest"
}

variable "frontend_image" {
  description = "Frontend container image name (without registry)."
  type        = string
  default     = "frontend:latest"
}

variable "sql_connection_string" {
  description = "SQL Server connection string for backend."
  type        = string
  sensitive   = true
  default     = ""
}

variable "app_insights_connection_string" {
  description = "Application Insights connection string."
  type        = string
  sensitive   = true
  default     = ""
}

variable "tags" {
  description = "Resource tags."
  type        = map(string)
  default     = {}
}

variable "acr_id" {
  description = "ACR resource ID for AcrPull role assignment."
  type        = string
  default     = ""
}
