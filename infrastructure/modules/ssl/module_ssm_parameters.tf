resource "aws_ssm_parameter" "server_key" {
  name  = format("/%s/%s/${var.module}/server-key", var.parameter_bundle.project, var.parameter_bundle.environment)
  type  = "SecureString"
  value = tls_private_key.integration_testing_client_key.private_key_pem

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_ssm_parameter" "server_crt" {
  name  = format("/%s/%s/${var.module}/server-crt", var.parameter_bundle.project, var.parameter_bundle.environment)
  type  = "SecureString"
  value = tls_locally_signed_cert.integration_testing_client_cert.cert_pem

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_ssm_parameter" "ca_crt" {
  name  = format("/%s/%s/${var.module}/ca-crt", var.parameter_bundle.project, var.parameter_bundle.environment)
  type  = "SecureString"
  value = tls_self_signed_cert.ca_cert.cert_pem

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_ssm_parameter" "ca_key" {
  name  = format("/%s/%s/${var.module}/ca-key", var.parameter_bundle.project, var.parameter_bundle.environment)
  type  = "SecureString"
  value = tls_private_key.ca_key.private_key_pem

  lifecycle {
    create_before_destroy = true
  }
}
