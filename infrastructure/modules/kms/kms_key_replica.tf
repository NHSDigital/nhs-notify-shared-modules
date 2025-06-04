resource "aws_kms_replica_key" "replica" {
  count                   = var.is_multi_region ? 1 : 0
  provider                = aws.us-east-1
  description             = "Multi-Region replica key"
  deletion_window_in_days = var.deletion_window
  primary_key_arn         = aws_kms_key.main.arn
}
