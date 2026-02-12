resource "aws_sns_topic_subscription" "firehose" {
  count = var.enable_event_cache ? 1 : 0

  topic_arn             = aws_sns_topic.main.arn
  protocol              = "firehose"
  subscription_role_arn = aws_iam_role.sns_role.arn
  endpoint              = aws_kinesis_firehose_delivery_stream.main[0].arn
  raw_message_delivery  = var.enable_firehose_raw_message_delivery
}
