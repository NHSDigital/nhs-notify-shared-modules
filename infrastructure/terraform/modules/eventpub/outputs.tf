output "sns_topic" {
  description = "SNS Topic ARN and Name"
  value = {
    arn  = aws_sns_topic.main.arn
    name = aws_sns_topic.main.name
  }
}

output "s3_bucket_event_cache" {
  description = "S3 Bucket ARN and Name for event cache"
  value = var.enable_event_cache ? {
    arn    = module.s3bucket_event_cache[0].arn
    bucket = module.s3bucket_event_cache[0].bucket
  } : {}
}

output "publishing_anomaly_alarm" {
  description = "CloudWatch anomaly detection alarm details for SNS publishing"
  value = var.enable_event_publishing_anomaly_detection ? {
    arn  = aws_cloudwatch_metric_alarm.publishing_anomaly[0].arn
    name = aws_cloudwatch_metric_alarm.publishing_anomaly[0].alarm_name
  } : null
}
