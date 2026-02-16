variable "resource_group_name" {
  description = "Resource group name."
  type        = string
}

variable "location" {
  description = "Azure region."
  type        = string
}

variable "server_name" {
  description = "SQL Server name (globally unique)."
  type        = string
}

variable "database_name" {
  description = "SQL Database name."
  type        = string
  default     = "contosouniversity"
}

variable "sku_name" {
  description = "Database SKU (e.g., Basic, S0, GP_S_Gen5_1)."
  type        = string
  default     = "Basic"
}

variable "max_size_gb" {
  description = "Maximum database size in GB."
  type        = number
  default     = 2
}

variable "aad_admin_login" {
  description = "AAD admin display name."
  type        = string
}

variable "aad_admin_object_id" {
  description = "AAD admin object ID (user or group)."
  type        = string
}

variable "aad_admin_tenant_id" {
  description = "AAD admin tenant ID."
  type        = string
}

variable "tags" {
  description = "Resource tags."
  type        = map(string)
  default     = {}
}

variable "private_endpoint_subnet_id" {
  description = "Subnet ID for the SQL private endpoint."
  type        = string
}

variable "sql_private_dns_zone_id" {
  description = "Private DNS zone ID for SQL Server private link."
  type        = string
}
