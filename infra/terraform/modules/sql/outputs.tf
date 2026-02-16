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
  description = "Prisma-compatible SQL Server connection string using AAD managed identity."
  value       = "sqlserver://${azurerm_mssql_server.this.fully_qualified_domain_name}:1433;database=${azurerm_mssql_database.this.name};encrypt=true;trustServerCertificate=false;authentication=ActiveDirectoryManagedIdentity"
  sensitive   = true
}
