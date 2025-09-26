resource "aws_lambda_function" "main" {
  function_name = local.csi
  description   = "Event forwarding function"

  role        = aws_iam_role.lambda.arn
  handler     = "index.handler"
  runtime     = "nodejs22.x"
  publish     = true
  memory_size = 128
  timeout     = 20

  s3_bucket         = aws_s3_object.lambda.bucket
  s3_key            = aws_s3_object.lambda.key
  s3_object_version = aws_s3_object.lambda.version_id

  logging_config {
    application_log_level = var.log_level
    log_format            = "JSON"
    log_group             = aws_cloudwatch_log_group.lambda.name
    system_log_level      = var.log_level
  }

  environment {
    variables = {
      DATA_PLANE_EVENT_BUS_ARN    = var.data_plane_bus_arn
      CONTROL_PLANE_EVENT_BUS_ARN = var.control_plane_bus_arn
      DLQ_URL                     = aws_sqs_queue.dlq.url
      THROTTLE_DELAY_MS           = "0"
    }
  }
}
