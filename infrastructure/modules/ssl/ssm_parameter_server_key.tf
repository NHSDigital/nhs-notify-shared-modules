resource "aws_ssm_parameter" "server_key" {
  name  = format("/%s/%s/${local.module}/server-key", var.project, var.environment)
  type  = "SecureString"
  value = tls_private_key.integration_testing_client_key.private_key_pem

  lifecycle {
    create_before_destroy = true
  }
}
