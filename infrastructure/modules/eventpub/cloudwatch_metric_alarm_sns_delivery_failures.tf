resource "aws_cloudwatch_metric_alarm" "sns_delivery_failures" {
  alarm_name          = "${local.csi}-sns-delivery-failures"
  alarm_description   = "${var.alarm_prefixes.sns_delivery} Alarm when SNS topic ${aws_sns_topic.main.name} has delivery failures"
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
