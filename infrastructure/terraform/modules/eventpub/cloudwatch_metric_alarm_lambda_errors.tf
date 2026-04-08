resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${local.csi}-lambda-errors-alarm"
  alarm_description   = "RELIABILITY: Alarm for Lambda function errors"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 1
  actions_enabled     = true
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.main.function_name
  }
}
