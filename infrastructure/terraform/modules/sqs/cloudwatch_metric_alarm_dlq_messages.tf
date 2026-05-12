resource "aws_cloudwatch_metric_alarm" "dlq_messages" {
  count = var.create_dlq && var.enable_dlq_alarm ? 1 : 0

  alarm_name          = "${local.csi}-dlq-messages-alarm"
  alarm_description   = "RELIABILITY: Alarm for messages in the DLQ"
  comparison_operator = var.dlq_alarm_config.comparison_operator
  evaluation_periods  = var.dlq_alarm_config.evaluation_periods
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = var.dlq_alarm_config.period
  statistic           = var.dlq_alarm_config.statistic
  threshold           = var.dlq_alarm_config.threshold
  actions_enabled     = var.dlq_alarm_config.actions_enabled
  treat_missing_data  = var.dlq_alarm_config.treat_missing_data

  dimensions = {
    QueueName = aws_sqs_queue.deadletter_queue[0].name
  }

  tags = local.default_tags
}
