output "server_crt" {
  description = "Server Certificate"
  value       = tls_locally_signed_cert.integration_testing_client_cert.cert_pem
  sensitive   = true
}

output "server_key" {
  description = "Server Key"
  value       = tls_private_key.integration_testing_client_key.private_key_pem
  sensitive   = true
}

output "cacert_pem" {
  description = "Truststore"
  value       = tls_self_signed_cert.ca_cert.cert_pem
  sensitive   = true
}
