resource "aws_lambda_function" "main" {
  function_name = local.csi
  description   = "Event forwarding function"

  role        = aws_iam_role.lambda.arn
  handler     = "index.handler"
  runtime     = "nodejs20.x" #change to nodejs22.x once core update done
  publish     = true
  memory_size = 128
  timeout     = 20

  filename         = "${path.module}/lambda/eventpub/eventpub.zip"
  source_code_hash = base64encode(filesha256("${path.module}/lambda/eventpub/eventpub.zip"))

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

  depends_on = [ null_resource.lambda_zip ]
}
