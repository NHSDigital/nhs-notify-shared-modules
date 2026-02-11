resource "aws_s3_bucket_notification" "main" {
  count  = length(local.notification_events) > 0 ? 1 : 0
  bucket = aws_s3_bucket.main.id

  eventbridge = local.notification_events.eventbridge

  dynamic "lambda_function" {
    for_each = length(local.notification_events.lambda_function) > 0 ? [1] : []

    content {
      id                  = try(local.notification_events.lambda_function.id, null)
      events              = local.notification_events.lambda_function.events
      filter_prefix       = try(local.notification_events.lambda_function.filter_prefix, null)
      filter_suffix       = try(local.notification_events.lambda_function.filter_suffix, null)
      lambda_function_arn = local.notification_events.lambda_function.lambda_function_arn
    }
  }

  dynamic "queue" {
    for_each = length(local.notification_events.queue) > 0 ? [1] : []

    content {
      id            = try(local.notification_events.queue.id, null)
      events        = local.notification_events.queue.events
      filter_prefix = try(local.notification_events.queue.filter_prefix, null)
      filter_suffix = try(local.notification_events.queue.filter_suffix, null)
      queue_arn     = local.notification_events.topic.queue
    }
  }

  dynamic "topic" {
    for_each = length(local.notification_events.topic) > 0 ? [1] : []

    content {
      id            = try(local.notification_events.topic.id, null)
      events        = local.notification_events.topic.events
      filter_prefix = try(local.notification_events.topic.filter_prefix, null)
      filter_suffix = try(local.notification_events.topic.filter_suffix, null)
      topic_arn     = local.notification_events.topic.topic_arn
    }
  }

  depends_on = [var.bucket_notification_depends_on]

}
