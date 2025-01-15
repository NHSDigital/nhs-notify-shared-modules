resource "aws_cloudwatch_event_target" "main" {
  count     = var.schedule == "" ? 0 : 1
  target_id = local.csi
  rule      = aws_cloudwatch_event_rule.main[0].name
  arn       = aws_lambda_function.main.arn
}
