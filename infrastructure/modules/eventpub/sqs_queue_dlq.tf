resource "aws_sqs_queue" "dlq" {
  name = "${local.csi}-dlq"

  kms_master_key_id = var.kms_key_arn
}
