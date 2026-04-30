resource "aws_s3_bucket_abac" "main" {
  count = var.enable_abac ? 1 : 0
  bucket = aws_s3_bucket.main.bucket

  abac_status {
    status = "Enabled"
  }
}
