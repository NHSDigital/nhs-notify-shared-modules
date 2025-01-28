resource "awscc_backup_restore_testing_plan" "main" {
  restore_testing_plan_name = local.resource_name_prefix
  schedule_expression       = var.restore_testing_plan_scheduled_expression
  start_window_hours        = var.restore_testing_plan_start_window
  recovery_point_selection = {
    algorithm             = var.restore_testing_plan_algorithm
    include_vaults        = [aws_backup_vault.main.arn]
    recovery_point_types  = var.restore_testing_plan_recovery_point_types
    selection_window_days = var.restore_testing_plan_selection_window_days
  }
}
