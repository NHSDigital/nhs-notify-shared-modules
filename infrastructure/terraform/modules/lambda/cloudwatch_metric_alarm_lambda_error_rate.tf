resource "aws_cloudwatch_metric_alarm" "lambda_error_rate" {
  count = var.enable_error_rate_alarm ? 1 : 0

  alarm_name          = "${local.csi}-lambda-error-rate-alarm"
  alarm_description   = "RELIABILITY: Alarm when Lambda error rate exceeds the configured percentage threshold"
  comparison_operator = var.lambda_error_rate_alarm_config.comparison_operator
  evaluation_periods  = var.lambda_error_rate_alarm_config.evaluation_periods
  threshold           = var.lambda_error_rate_alarm_config.threshold
  actions_enabled     = var.lambda_error_rate_alarm_config.actions_enabled
  treat_missing_data  = var.lambda_error_rate_alarm_config.treat_missing_data

  metric_query {
    id          = "e1"
    expression  = "IF(m2>0,(m1/m2)*100,0)"
    label       = "ErrorRatePercent"
    return_data = true
  }

  metric_query {
    id = "m1"

    metric {
      metric_name = "Errors"
      namespace   = "AWS/Lambda"
      period      = var.lambda_error_rate_alarm_config.period
      stat        = "Sum"
      dimensions = {
        FunctionName = aws_lambda_function.main.function_name
      }
    }
  }

  metric_query {
    id = "m2"

    metric {
      metric_name = "Invocations"
      namespace   = "AWS/Lambda"
      period      = var.lambda_error_rate_alarm_config.period
      stat        = "Sum"
      dimensions = {
        FunctionName = aws_lambda_function.main.function_name
      }
    }
  }

  tags = local.default_tags
}