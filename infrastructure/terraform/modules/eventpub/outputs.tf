output "sns_topic" {
  description = "SNS Topic ARN and Name"
  value = {
    arn  = aws_sns_topic.main.arn
    name = aws_sns_topic.main.name
  }
}

output "dlq" {
  description = "EventPub DLQ name and ARN"
  value = {
    arn  = aws_sqs_queue.dlq.arn
    name = aws_sqs_queue.dlq.name
  }
}

output "sqs_queue" {
  description = "EventPub SQS queue name, ARN, and DLQ details"
  value = {
    arn      = module.sqs_queue.sqs_queue_arn
    name     = module.sqs_queue.sqs_queue_name
    dlq_arn  = module.sqs_queue.sqs_dlq_arn
    dlq_name = module.sqs_queue.sqs_dlq_name
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
  value = var.enable_event_anomaly_detection ? {
    arn  = aws_cloudwatch_metric_alarm.publishing_anomaly[0].arn
    name = aws_cloudwatch_metric_alarm.publishing_anomaly[0].alarm_name
  } : null
}
