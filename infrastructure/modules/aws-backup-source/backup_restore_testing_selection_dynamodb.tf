resource "awscc_backup_restore_testing_selection" "backup_restore_testing_selection_dynamodb" {
  count = var.backup_plan_config_dynamodb.enable ? 1 : 0

  iam_role_arn                   = aws_iam_role.backup.arn
  protected_resource_type        = "DynamoDB"
  restore_testing_plan_name      = awscc_backup_restore_testing_plan.main.restore_testing_plan_name
  restore_testing_selection_name = "backup_restore_testing_selection_dynamodb"
  protected_resource_arns        = ["*"]
  protected_resource_conditions = {
    string_equals = [{
      key   = "aws:ResourceTag/${var.backup_plan_config_dynamodb.selection_tag}"
      value = "True"
    }]
  }
}
