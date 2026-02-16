output "server_id" {
  description = "SQL Server resource ID."
  value       = azurerm_mssql_server.this.id
}

output "server_fqdn" {
  description = "Fully qualified domain name of the SQL Server."
  value       = azurerm_mssql_server.this.fully_qualified_domain_name
}

output "database_id" {
  description = "SQL Database resource ID."
  value       = azurerm_mssql_database.this.id
}

output "database_name" {
  description = "SQL Database name."
  value       = azurerm_mssql_database.this.name
}

output "connection_string" {
  description = "Prisma-compatible SQL Server connection string."
  value       = "sqlserver://${azurerm_mssql_server.this.fully_qualified_domain_name}:1433;database=${azurerm_mssql_database.this.name};user=${var.sql_admin_login};password=${var.sql_admin_password};encrypt=true;trustServerCertificate=false"
  sensitive   = true
}
