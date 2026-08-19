resource "aws_cloudwatch_metric_alarm" "subscriber_anomaly" {
  count = var.enable_event_anomaly_detection ? 1 : 0

  alarm_name          = "${local.csi}-subscriber-anomaly"
  alarm_description   = "ANOMALY: Detects anomalous patterns in messages published to the SNS fanout topic"
  comparison_operator = "LessThanLowerOrGreaterThanUpperThreshold"
  evaluation_periods  = var.event_anomaly_evaluation_periods
  threshold_metric_id = "ad1"
  treat_missing_data  = "notBreaching"

  metric_query {
    id          = "m1"
    return_data = true

    metric {
      metric_name = "NumberOfNotificationsDelivered"
      namespace   = "AWS/SNS"
      period      = var.event_anomaly_period
      stat        = "Sum"

      dimensions = {
        TopicName = aws_sns_topic.main.name
      }
    }
  }

  metric_query {
    id          = "ad1"
    expression  = "ANOMALY_DETECTION_BAND(m1, ${var.event_anomaly_band_width})"
    label       = "NumberOfNotificationsDelivered (expected)"
    return_data = true
  }

  tags = merge(
    var.default_tags,
    {
      Name = "${local.csi}-subscriber-anomaly"
    }
  )
}
