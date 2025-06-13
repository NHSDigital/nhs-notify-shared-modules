resource "aws_lambda_permission" "sns_lambda" {
  for_each = local.sns_topics

  statement_id  = "AllowExecutionFromSNS${title(each.key)}Topic"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.main.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.main[each.key].arn
}
