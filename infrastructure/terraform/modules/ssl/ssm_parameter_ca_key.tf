resource "aws_ssm_parameter" "ca_key" {
  name  = format("/%s/%s/%s/${local.module}/ca-key", var.project, var.component, var.environment)
  type  = "SecureString"
  value = tls_private_key.ca_key.private_key_pem

  lifecycle {
    create_before_destroy = true
  }
}
