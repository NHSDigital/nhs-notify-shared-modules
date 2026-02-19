resource "aws_ssm_parameter" "ca_crt" {
  name  = format("/%s/%s/%s/${local.module}/ca-crt", var.project, var.component, var.environment)
  type  = "SecureString"
  value = tls_self_signed_cert.ca_cert.cert_pem

  lifecycle {
    create_before_destroy = true
  }
}
