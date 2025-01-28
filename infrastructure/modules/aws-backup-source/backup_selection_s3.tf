resource "aws_backup_selection" "s3" {
  count = var.backup_plan_config_s3.enable ? 1 : 0

  iam_role_arn = aws_iam_role.backup.arn
  name         = "${local.resource_name_prefix}-s3-selection"
  plan_id      = aws_backup_plan.s3[0].id

  selection_tag {
    key   = "Envrionment"
    type  = "STRINGEQUALS"
    value = var.environment_name
  }

  selection_tag {
    key   = var.backup_plan_config_s3.selection_tag
    type  = "STRINGEQUALS"
    value = "True"
  }
}
