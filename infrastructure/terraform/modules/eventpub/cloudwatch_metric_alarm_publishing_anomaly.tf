resource "aws_cloudwatch_metric_alarm" "publishing_anomaly" {
  count = var.enable_event_publishing_anomaly_detection ? 1 : 0

  alarm_name          = "${local.csi}-sns-publishing-anomaly"
  alarm_description   = "RELIABILITY: Anomaly detection alarm for abnormal SNS message publishing patterns. Detects unexpected drops or spikes in event publishing volume that may indicate service degradation or misconfiguration."
  comparison_operator = "LessThanLowerOrGreaterThanUpperThreshold"
  evaluation_periods  = var.event_publishing_anomaly_evaluation_periods # Number of evaluation periods for the publishing anomaly alarm.
  threshold_metric_id = "ad1"
  treat_missing_data  = "notBreaching"
  actions_enabled     = true

  tags = merge(
    local.default_tags,
    {
      AlarmType    = "AnomalyDetection"
      AlarmPurpose = "EventPublishingAbnormality"
    }
  )

  metric_query {
    id          = "m1"
    return_data = true

    metric {
      metric_name = "NumberOfMessagesPublished"
      namespace   = "AWS/SNS"
      period      = var.event_publishing_anomaly_period # The period in seconds over which the specified statistic is applied for anomaly detection.
      stat        = "Sum"

      dimensions = {
        TopicName = aws_sns_topic.main.name
      }
    }
  }

  metric_query {
    id          = "ad1"
    expression  = "ANOMALY_DETECTION_BAND(m1, ${var.event_publishing_anomaly_band_width})" # The width of the anomaly detection band. Higher values (e.g. 4-6) reduce sensitivity and noise, lower values (e.g. 2-3) increase sensitivity.
    label       = "NumberOfMessagesPublished (expected)"
    return_data = true
  }
}
