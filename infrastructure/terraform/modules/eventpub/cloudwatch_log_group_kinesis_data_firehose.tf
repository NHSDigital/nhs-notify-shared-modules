resource "aws_cloudwatch_log_group" "kinesis_data_firehose" {
  count = var.enable_event_cache ? 1 : 0

  name              = "/aws/firehose/${local.csi}"
  kms_key_id        = var.kms_key_arn
  retention_in_days = var.log_retention_in_days
}

resource "aws_cloudwatch_log_stream" "kinesis_data_firehose_extended_s3" {
  count = var.enable_event_cache ? 1 : 0

  name           = "extended_s3"
  log_group_name = aws_cloudwatch_log_group.kinesis_data_firehose[0].name
}
