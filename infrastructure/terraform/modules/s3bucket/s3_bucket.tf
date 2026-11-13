resource "aws_s3_bucket" "main" {
  bucket        = local.csi_global
  force_destroy = var.force_destroy

  tags = local.default_tags
}
