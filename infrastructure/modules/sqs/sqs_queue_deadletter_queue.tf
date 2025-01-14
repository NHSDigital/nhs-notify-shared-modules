resource "aws_sqs_queue" "deadletter_queue" {
  count = var.create_dlq ? 1 : 0

  name = "${local.csi}-dlq"

  message_retention_seconds   = var.message_retention_seconds
  visibility_timeout_seconds  = var.visibility_timeout_seconds
  fifo_queue                  = var.fifo_queue
  content_based_deduplication = var.content_based_deduplication
  max_message_size            = var.max_message_size

  kms_master_key_id                 = var.sqs_kms_key_arn
  kms_data_key_reuse_period_seconds = var.kms_data_key_reuse_period_seconds

  tags = local.default_tags
}
