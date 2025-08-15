resource "tls_self_signed_cert" "ca_cert" {
  private_key_pem = tls_private_key.ca_key.private_key_pem

  is_ca_certificate = true

  subject {
    country             = "GB"
    province            = "West Yorkshire"
    locality            = "Leeds"
    common_name         = "${var.module}.${var.parameter_bundle.environment}-ca.communications.national.nhs.uk"
    organization        = "NHS England"
    organizational_unit = "NHS Notify"
  }

  validity_period_hours = 17520

  allowed_uses = [
    "digital_signature",
    "cert_signing",
    "crl_signing",
  ]
}
