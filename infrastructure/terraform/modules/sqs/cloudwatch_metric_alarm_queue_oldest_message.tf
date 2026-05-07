resource "aws_cloudwatch_metric_alarm" "queue_oldest_message" {
  count = var.enable_queue_oldest_message_alarm ? 1 : 0

  alarm_name          = "${local.csi}-queue-oldest-message-alarm"
  alarm_description   = "RELIABILITY: Alarm for old messages in the queue"
  comparison_operator = lookup(var.queue_oldest_message_alarm_config, "comparison_operator", "GreaterThanThreshold")
  evaluation_periods  = lookup(var.queue_oldest_message_alarm_config, "evaluation_periods", 1)
  metric_name         = "ApproximateAgeOfOldestMessage"
  namespace           = "AWS/SQS"
  period              = lookup(var.queue_oldest_message_alarm_config, "period", 300)
  statistic           = lookup(var.queue_oldest_message_alarm_config, "statistic", "Maximum")
  threshold           = lookup(var.queue_oldest_message_alarm_config, "threshold", 300)
  actions_enabled     = lookup(var.queue_oldest_message_alarm_config, "actions_enabled", true)
  treat_missing_data  = lookup(var.queue_oldest_message_alarm_config, "treat_missing_data", "notBreaching")

  dimensions = {
    QueueName = aws_sqs_queue.sqs_queue.name
  }

  tags = local.default_tags
}
