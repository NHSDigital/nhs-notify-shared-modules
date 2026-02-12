resource "tls_private_key" "ca_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}
