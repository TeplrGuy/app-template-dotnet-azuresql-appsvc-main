# DEPRECATED: This is a legacy outputs file.
# This file is kept for backward compatibility but should not be used directly.
# 
# Use the environment-specific Terraform configurations instead:
#   - infra/terraform/envs/staging/ for staging deployments
#   - infra/terraform/envs/prod/     for production deployments

output "note" {
  description = "Informational output for this Terraform skeleton."
  value       = "Use infra/terraform/envs/{staging,prod} as the Terraform root modules."
}
