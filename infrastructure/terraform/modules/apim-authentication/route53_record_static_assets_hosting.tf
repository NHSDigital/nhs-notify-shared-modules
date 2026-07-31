resource "aws_route53_record" "static_assets_hosting" {
  name    = local.root_domain_name
  zone_id = local.root_domain_id
  type    = "CNAME"
  ttl     = 5
  records = [aws_cloudfront_distribution.static_assets_hosting.domain_name]
}
