resource "aws_cloudwatch_metric_alarm" "lambda_dlq_messages" {
  count = var.enable_dlq_and_notifications && var.enable_dlq_messages_alarm ? 1 : 0

  alarm_name          = "${local.csi}-lambda-dlq-messages-alarm"
  alarm_description   = "RELIABILITY: Alarm when visible messages are present in the Lambda DLQ"
  comparison_operator = var.lambda_dlq_messages_alarm_config.comparison_operator
  evaluation_periods  = var.lambda_dlq_messages_alarm_config.evaluation_periods
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = var.lambda_dlq_messages_alarm_config.period
  statistic           = var.lambda_dlq_messages_alarm_config.statistic
  threshold           = var.lambda_dlq_messages_alarm_config.threshold
  actions_enabled     = var.lambda_dlq_messages_alarm_config.actions_enabled
  treat_missing_data  = var.lambda_dlq_messages_alarm_config.treat_missing_data

  dimensions = {
    QueueName = aws_sqs_queue.lambda_dlq[0].name
  }

  tags = local.default_tags
}
