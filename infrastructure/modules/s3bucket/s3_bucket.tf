#trivy:ignore:aws-s3-enable-bucket-logging Logging is a depricated attribute, use aws_s3_bucket_logging resource
resource "aws_s3_bucket" "main" {
  bucket        = local.csi_global
  force_destroy = var.force_destroy

  tags = local.default_tags
}
