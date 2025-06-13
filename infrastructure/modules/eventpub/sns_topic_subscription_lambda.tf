resource "aws_sns_topic_subscription" "lambda" {
  for_each = local.sns_topics

  topic_arn = aws_sns_topic.main[each.key].arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.main.arn
}
