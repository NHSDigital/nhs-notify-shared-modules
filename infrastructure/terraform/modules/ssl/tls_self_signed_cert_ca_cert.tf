resource "tls_self_signed_cert" "ca_cert" {
  private_key_pem = tls_private_key.ca_key.private_key_pem

  is_ca_certificate = true

  subject {
    country             = var.subject_country
    province            = var.subject_province
    locality            = var.subject_locality
    common_name         = "ca-${var.subject_common_name}"
    organization        = var.subject_organization
    organizational_unit = var.subject_organizational_unit
  }

  validity_period_hours = 17520

  allowed_uses = [
    "digital_signature",
    "cert_signing",
    "crl_signing",
  ]
}
