resource "aws_kinesis_firehose_delivery_stream" "main" {
  count = var.enable_event_cache ? 1 : 0

  name        = local.csi
  destination = "extended_s3"


  server_side_encryption {
    enabled  = true
    key_type = "CUSTOMER_MANAGED_CMK"
    key_arn  = var.kms_key_arn
  }

  extended_s3_configuration {
    role_arn           = aws_iam_role.firehose_role[0].arn
    bucket_arn         = module.s3bucket_event_cache[0].arn
    buffering_interval = var.event_cache_buffer_interval

    cloudwatch_logging_options {
      enabled         = true
      log_group_name  = aws_cloudwatch_log_group.kinesis_data_firehose[0].name
      log_stream_name = aws_cloudwatch_log_stream.kinesis_data_firehose_extended_s3[0].name
    }
  }
}
