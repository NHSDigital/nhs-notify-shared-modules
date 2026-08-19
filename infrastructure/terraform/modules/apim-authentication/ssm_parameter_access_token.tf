resource "aws_ssm_parameter" "access_token" {
  name        = local.apim_access_token_ssm_parameter_name
  description = "Access token for APIM"
  type        = "SecureString"
  value       = jsonencode({})

  tags = merge(local.default_tags, { Backup = "true" })

  lifecycle {
    ignore_changes = [
      value
    ]
  }
}
