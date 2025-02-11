resource "aws_lambda_function" "main" {
  function_name = local.csi
  description   = "Event forwarding function"

  role        = aws_iam_role.lambda.arn
  handler     = "index.handler"
  runtime     = "nodejs20.x"
  publish     = true
  memory_size = 128
  timeout     = 20

  filename         = data.archive_file.lambda.output_path
  source_code_hash = data.archive_file.lambda.output_base64sha256

  logging_config {
    application_log_level = "INFO"
    log_format            = "JSON"
    log_group             = aws_cloudwatch_log_group.lambda.name
    system_log_level      = "WARN"
  }

  environment {
    variables = {
      DATA_PLANE_EVENT_BUS_ARN    = var.data_plane_bus_arn
      CONTROL_PLANE_EVENT_BUS_ARN = var.control_plane_bus_arn
    }
  }
}
