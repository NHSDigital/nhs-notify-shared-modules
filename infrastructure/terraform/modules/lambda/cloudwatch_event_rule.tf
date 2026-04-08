resource "aws_cloudwatch_event_rule" "main" {
  count               = var.schedule == "" ? 0 : 1
  name                = local.csi
  description         = local.csi
  schedule_expression = var.schedule
  state               = "ENABLED"
}
