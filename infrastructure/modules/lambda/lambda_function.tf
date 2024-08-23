resource "aws_lambda_function" "main" {
  description   = var.description
  function_name = local.csi
  role          = aws_iam_role.main.arn
  handler       = "${var.function_module_name}.${var.handler_function_name}"
  runtime       = var.runtime
  publish       = true
  memory_size   = var.memory
  timeout       = var.timeout

  s3_bucket         = aws_s3_object.lambda.bucket
  s3_key            = aws_s3_object.lambda.key
  s3_object_version = aws_s3_object.lambda.version_id

  logging_config {
    application_log_level = var.application_log_level
    log_format            = "JSON"
    log_group             = aws_cloudwatch_log_group.main.name
    system_log_level      = var.system_log_level
  }

  layers = compact(concat(
    var.layers,
    [
      var.enable_lambda_insights && var.lambda_at_edge == false ? "arn:aws:lambda:${var.region}:580247275435:layer:LambdaInsightsExtension:53" : null
    ]
  ))

  environment {
    variables = var.lambda_env_vars
  }

  dynamic "dead_letter_config" {
    for_each = var.enable_dlq_and_notifications ? [1] : []
    content {
      target_arn = aws_sqs_queue.lambda_dlq[0].arn
    }
  }

  dynamic "vpc_config" {
    for_each = var.vpc_config != null ? [""] : []

    content {
      subnet_ids         = var.vpc_config["subnet_ids"]
      security_group_ids = var.vpc_config["security_group_ids"]
    }
  }

  tags = merge(
    local.default_tags,
    {
      Name = local.csi
    },
  )
}
