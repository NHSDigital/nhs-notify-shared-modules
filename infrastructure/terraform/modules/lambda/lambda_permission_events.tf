resource "aws_lambda_permission" "events" {
  count = var.schedule == "" ? 0 : 1

  function_name = aws_lambda_function.main.function_name
  statement_id  = "AllowExecutionFromCloudWatchEvents"
  action        = "lambda:InvokeFunction"
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.main[0].arn
}
