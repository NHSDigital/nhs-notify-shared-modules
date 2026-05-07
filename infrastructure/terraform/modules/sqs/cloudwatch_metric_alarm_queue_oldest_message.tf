resource "aws_cloudwatch_metric_alarm" "queue_oldest_message" {
  count = var.enable_queue_oldest_message_alarm ? 1 : 0

  alarm_name          = "${local.csi}-queue-oldest-message-alarm"
  alarm_description   = "RELIABILITY: Alarm for old messages in the queue"
  comparison_operator = var.queue_oldest_message_alarm_config.comparison_operator
  evaluation_periods  = var.queue_oldest_message_alarm_config.evaluation_periods
  metric_name         = "ApproximateAgeOfOldestMessage"
  namespace           = "AWS/SQS"
  period              = var.queue_oldest_message_alarm_config.period
  statistic           = var.queue_oldest_message_alarm_config.statistic
  threshold           = var.queue_oldest_message_alarm_config.threshold
  actions_enabled     = var.queue_oldest_message_alarm_config.actions_enabled
  treat_missing_data  = var.queue_oldest_message_alarm_config.treat_missing_data

  dimensions = {
    QueueName = aws_sqs_queue.sqs_queue.name
  }

  tags = local.default_tags
}
