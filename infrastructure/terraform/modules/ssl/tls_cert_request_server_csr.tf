resource "tls_cert_request" "server_csr" {

  private_key_pem = tls_private_key.integration_testing_client_key.private_key_pem

  dns_names = [var.subject_common_name]

  subject {
    country             = var.subject_country
    province            = var.subject_province
    locality            = var.subject_locality
    common_name         = var.subject_common_name
    organization        = var.subject_organization
    organizational_unit = var.subject_organizational_unit
  }

  depends_on = [
    tls_private_key.integration_testing_client_key,
  ]
}
