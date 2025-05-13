resource "aws_cloudwatch_log_subscription_filter" "amplify" {
  count = var.send_to_firehose ? 1 : 0
  name            = replace(aws_cloudwatch_log_group.main.name, "/", "-")
  log_group_name  = aws_cloudwatch_log_group.main.name
  filter_pattern  = var.filter_pattern
  destination_arn = var.destination_arn
  role_arn        = var.log_subscription_log_role_arn
}
