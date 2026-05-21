resource "aws_cloudwatch_metric_alarm" "lambda_throttles" {
  count = var.enable_throttles_alarm ? 1 : 0

  alarm_name          = "${local.csi}-lambda-throttles-alarm"
  alarm_description   = "RELIABILITY: Alarm when Lambda throttles exceed the configured threshold"
  comparison_operator = var.lambda_throttles_alarm_config.comparison_operator
  evaluation_periods  = var.lambda_throttles_alarm_config.evaluation_periods
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = var.lambda_throttles_alarm_config.period
  statistic           = var.lambda_throttles_alarm_config.statistic
  threshold           = var.lambda_throttles_alarm_config.threshold
  actions_enabled     = var.lambda_throttles_alarm_config.actions_enabled
  treat_missing_data  = var.lambda_throttles_alarm_config.treat_missing_data

  dimensions = {
    FunctionName = aws_lambda_function.main.function_name
  }

  tags = local.default_tags
}
