resource "aws_backup_selection" "dynamodb" {
  count = var.backup_plan_config_dynamodb.enable ? 1 : 0

  iam_role_arn = aws_iam_role.backup.arn
  name         = "${local.resource_name_prefix}-dynamodb-selection"
  plan_id      = aws_backup_plan.dynamodb[0].id

  selection_tag {
    key   = "Envrionment"
    type  = "STRINGEQUALS"
    value = var.environment_name
  }

  selection_tag {
    key   = var.backup_plan_config_dynamodb.selection_tag
    type  = "STRINGEQUALS"
    value = "True"
  }
}
