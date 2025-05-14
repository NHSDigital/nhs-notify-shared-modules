resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${local.csi}"
  retention_in_days = var.log_retention_in_days
  kms_key_id        = var.kms_key_arn
}
