resource "tls_locally_signed_cert" "integration_testing_client_cert" {
  cert_request_pem   = tls_cert_request.server_csr.cert_request_pem
  ca_private_key_pem = tls_private_key.ca_key.private_key_pem
  ca_cert_pem        = tls_self_signed_cert.ca_cert.cert_pem

  validity_period_hours = 8760

  allowed_uses = [
    "digital_signature",
    "key_encipherment",
    "server_auth",
    "client_auth",
  ]

  depends_on = [
    tls_private_key.ca_key,
    tls_self_signed_cert.ca_cert,
    tls_private_key.integration_testing_client_key,
    tls_cert_request.server_csr
  ]
}
