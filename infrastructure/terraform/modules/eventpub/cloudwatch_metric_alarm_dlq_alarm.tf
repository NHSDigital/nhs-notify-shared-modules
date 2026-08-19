resource "aws_cloudwatch_metric_alarm" "dlq_alarm" {
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
    QueueName = module.sqs_queue.sqs_dlq_name
  }
}
