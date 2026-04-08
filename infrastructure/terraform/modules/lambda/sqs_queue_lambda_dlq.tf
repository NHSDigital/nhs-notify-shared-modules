resource "aws_sqs_queue" "lambda_dlq" {
  count = var.enable_dlq_and_notifications ? 1 : 0

  name = "${local.csi}-lambda-dlq"

  message_retention_seconds   = var.lambda_dlq_message_retention_seconds
  visibility_timeout_seconds  = 300
  fifo_queue                  = false
  content_based_deduplication = false
  max_message_size            = 262144

  kms_master_key_id                 = var.kms_key_arn
  kms_data_key_reuse_period_seconds = 300

  tags = local.default_tags
}
