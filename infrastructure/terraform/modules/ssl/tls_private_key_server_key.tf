resource "tls_private_key" "integration_testing_client_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}
