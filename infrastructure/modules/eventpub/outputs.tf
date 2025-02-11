output "sns_topic" {
  value = {
    arn  = aws_sns_topic.main.arn
    name = aws_sns_topic.main.name
  }
}

output "s3_bucket_event_cache" {
  value = var.enable_event_cache ? {
    arn    = module.s3bucket_event_cache[0].arn
    bucket = module.s3bucket_event_cache[0].bucket
  } : {}
}
