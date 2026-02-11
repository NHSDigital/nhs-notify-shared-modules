resource "aws_ssm_parameter" "server_crt" {
  name  = format("/%s/%s/%s/${local.module}/server-crt", var.project, var.component, var.environment)
  type  = "SecureString"
  value = tls_locally_signed_cert.integration_testing_client_cert.cert_pem

  lifecycle {
    create_before_destroy = true
  }
}
