resource "aws_acm_certificate" "static_assets_hosting" {
  provider          = aws.us-east-1
  domain_name       = var.root_domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_acm_certificate_validation" "static_assets_hosting" {
  provider        = aws.us-east-1
  certificate_arn = aws_acm_certificate.static_assets_hosting.arn
}
