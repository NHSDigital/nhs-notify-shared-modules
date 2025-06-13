output "sns_topic" {
  description = "SNS Topic ARNs and Names"
  value = {
    for key, value in aws_sns_topic.main :
    key => {
      arn  = value.arn
      name = value.name
    }
  }
}

output "s3_bucket_event_cache" {
  description = "S3 Bucket ARN and Name for event cache"
  value = var.enable_event_cache ? {
    arn    = module.s3bucket_event_cache[0].arn
    bucket = module.s3bucket_event_cache[0].bucket
  } : {}
}
