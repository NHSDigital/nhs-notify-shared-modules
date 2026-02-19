resource "aws_lambda_function" "main" {
  description   = var.description
  function_name = local.csi
  role          = aws_iam_role.main.arn
  handler       = local.package_type == "zip" ? "${var.function_module_name}.${var.handler_function_name}" : null
  runtime       = local.package_type == "zip" ? var.runtime : null
  package_type  = title(local.package_type)
  publish       = true
  memory_size   = var.memory
  timeout       = var.timeout

  s3_bucket         = local.package_type == "zip" ? aws_s3_object.lambda[0].bucket : null
  s3_key            = local.package_type == "zip" ? aws_s3_object.lambda[0].key : null
  s3_object_version = local.package_type == "zip" ? aws_s3_object.lambda[0].version_id : null

  image_uri = local.package_type == "image" ? var.image_uri : null

  dynamic "image_config" {
    for_each = local.package_type == "image" && var.image_config != null ? [1] : []
    content {
      entry_point       = try(var.image_config.entry_point, null)
      command           = try(var.image_config.command, null)
      working_directory = try(var.image_config.working_directory, null)
    }
  }

  logging_config {
    application_log_level = var.application_log_level
    log_format            = "JSON"
    log_group             = aws_cloudwatch_log_group.main.name
    system_log_level      = var.system_log_level
  }

  layers = local.package_type == "zip" ? compact(concat(
    var.layers,
    [
      var.enable_lambda_insights && var.lambda_at_edge == false ? "arn:aws:lambda:${var.region}:580247275435:layer:LambdaInsightsExtension:53" : null
    ]
  )) : []

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
