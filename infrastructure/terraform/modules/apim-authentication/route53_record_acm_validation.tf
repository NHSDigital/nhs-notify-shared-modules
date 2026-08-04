resource "aws_route53_record" "acm_validation" {
  for_each = {
    for dvo in aws_acm_certificate.static_assets_hosting.domain_validation_options :
    dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    } if dvo.domain_name == var.root_domain_name
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  type            = each.value.type
  zone_id         = var.root_domain_id
  ttl             = 60
}
