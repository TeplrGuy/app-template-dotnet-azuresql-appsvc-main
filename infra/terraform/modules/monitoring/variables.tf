variable "resource_group_name" {
  description = "Resource group name."
  type        = string
}

variable "location" {
  description = "Azure region (e.g., eastus2)."
  type        = string
}

variable "log_analytics_workspace_name" {
  description = "Log Analytics workspace name."
  type        = string
}

variable "log_analytics_sku" {
  description = "Log Analytics SKU."
  type        = string
  default     = "PerGB2018"
}

variable "log_analytics_retention_in_days" {
  description = "Workspace retention in days."
  type        = number
  default     = 30
}

variable "application_insights_name" {
  description = "Application Insights resource name."
  type        = string
}

variable "tags" {
  description = "Resource tags."
  type        = map(string)
  default     = {}
}
