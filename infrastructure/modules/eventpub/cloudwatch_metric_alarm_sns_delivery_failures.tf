resource "aws_cloudwatch_metric_alarm" "sns_delivery_failures" {
  alarm_name          = "${local.csi}-sns-delivery-failures"
  alarm_description   = "RELIABILITY: Alarm for SNS topic delivery failures"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "NumberOfNotificationsFailed"
  namespace           = "AWS/SNS"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  treat_missing_data  = "notBreaching"

  dimensions = {
    TopicName = aws_sns_topic.main.name
  }
}
