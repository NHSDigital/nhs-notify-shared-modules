resource "aws_s3_bucket_acl" "main" {
  count  = var.object_ownership == "BucketOwnerEnforced" ? 0 : 1

  bucket = aws_s3_bucket.main.id
  acl    = var.acl

  depends_on = [
    aws_s3_bucket_ownership_controls.main
  ]
}
