resource "aws_cloudwatch_metric_alarm" "lambda_duration" {
  count = var.enable_duration_alarm ? 1 : 0

  alarm_name          = "${local.csi}-lambda-duration-alarm"
  alarm_description   = "RELIABILITY: Alarm when Lambda duration percentile exceeds the configured threshold"
  comparison_operator = var.lambda_duration_alarm_config.comparison_operator
  evaluation_periods  = var.lambda_duration_alarm_config.evaluation_periods
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = var.lambda_duration_alarm_config.period
  extended_statistic  = var.lambda_duration_alarm_config.percentile
  threshold           = coalesce(var.lambda_duration_alarm_config.threshold_ms, var.timeout * 800)
  actions_enabled     = var.lambda_duration_alarm_config.actions_enabled
  treat_missing_data  = var.lambda_duration_alarm_config.treat_missing_data

  dimensions = {
    FunctionName = aws_lambda_function.main.function_name
  }

  tags = local.default_tags
}
