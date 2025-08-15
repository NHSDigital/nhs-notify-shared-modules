resource "tls_cert_request" "server_csr" {

  private_key_pem = tls_private_key.integration_testing_client_key.private_key_pem

  dns_names = ["${var.module}.${var.parameter_bundle.environment}.communications.national.nhs.uk"]

  subject {
    country             = "GB"
    province            = "West Yorkshire"
    locality            = "Leeds"
    common_name         = "${var.module}.${var.parameter_bundle.environment}.communications.national.nhs.uk"
    organization        = "NHS England"
    organizational_unit = "NHS Notify"
  }

  depends_on = [
    tls_private_key.integration_testing_client_key,
  ]
}
