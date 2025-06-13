resource "aws_sns_topic_subscription" "firehose" {
  for_each = var.enable_event_cache ? local.sns_topics : {}

  topic_arn             = aws_sns_topic[each.key].arn
  protocol              = "firehose"
  subscription_role_arn = aws_iam_role.sns_role.arn
  endpoint              = aws_kinesis_firehose_delivery_stream.main[0].arn
}
