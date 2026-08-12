resource "aws_cloudfront_distribution" "static_assets_hosting" {
  enabled         = true
  is_ipv6_enabled = true
  comment         = "Static asset hosting for APIM Public Key"
  price_class     = "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "whitelist"
      locations        = ["GB"]
    }
  }

  aliases = [var.root_domain_name]

  viewer_certificate {
    cloudfront_default_certificate = false
    acm_certificate_arn            = aws_acm_certificate.static_assets_hosting.arn
    minimum_protocol_version       = "TLSv1.2_2021"
    ssl_support_method             = "sni-only"
  }

  logging_config {
    include_cookies = false
    bucket          = "${var.cdn_logs_bucket_id}.s3.amazonaws.com"
    prefix          = "${local.csi}/static-assets/"
  }

  origin {
    domain_name = module.s3bucket_static_assets.bucket_regional_domain_name
    origin_id   = "${local.csi}-origin-static-assets"
    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.static_assets.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "${local.csi}-origin-static-assets"

    forwarded_values {
      query_string = false
      headers      = ["Origin"]
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 86400
    compress               = true
  }
}
