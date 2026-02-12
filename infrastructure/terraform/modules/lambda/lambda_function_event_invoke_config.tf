resource "aws_lambda_function_event_invoke_config" "lambda_destination" {
  count = var.enable_dlq_and_notifications ? 1 : 0

  function_name = aws_lambda_function.main.arn

  destination_config {
    on_failure {
      destination = var.sns_destination
    }
  }
}
