resource "aws_kms_replica_key" "replica" {
  provider = aws.us-east-1
  count    = var.is_multi_region ? 1 : 0

  description             = "Multi-Region replica key"
  deletion_window_in_days = var.deletion_window
  policy                  = data.aws_iam_policy_document.key.json
  primary_key_arn         = aws_kms_key.main.arn
}
