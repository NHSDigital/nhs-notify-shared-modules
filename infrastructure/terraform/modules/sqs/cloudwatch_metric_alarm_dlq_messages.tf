resource "aws_cloudwatch_metric_alarm" "dlq_messages" {
  count = var.create_dlq && var.enable_dlq_alarm ? 1 : 0

  alarm_name          = "${local.csi}-dlq-messages-alarm"
  alarm_description   = "RELIABILITY: Alarm for messages in the DLQ"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  actions_enabled     = true
  treat_missing_data  = "notBreaching"

  dimensions = {
    QueueName = aws_sqs_queue.deadletter_queue[0].name
  }

  tags = local.default_tags
}
