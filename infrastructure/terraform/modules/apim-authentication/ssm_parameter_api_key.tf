resource "aws_ssm_parameter" "api_key" {
  name        = local.apim_api_key_ssm_parameter_name
  description = "API Key for APIM"
  type        = "SecureString"
  value       = "unset"
  tags        = merge(local.default_tags, { Backup = "true" })

  lifecycle {
    ignore_changes = [
      value
    ]
  }
}
