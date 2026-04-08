resource "aws_cloudwatch_log_subscription_filter" "firehose" {
  count           = var.send_to_firehose ? 1 : 0
  name            = trim(replace(aws_cloudwatch_log_group.main.name, "/", "-"), "-")
  log_group_name  = aws_cloudwatch_log_group.main.name
  filter_pattern  = var.filter_pattern
  destination_arn = var.log_destination_arn
  role_arn        = var.log_subscription_role_arn
}
