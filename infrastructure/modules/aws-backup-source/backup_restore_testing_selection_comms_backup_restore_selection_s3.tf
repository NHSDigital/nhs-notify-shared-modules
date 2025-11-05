resource "aws_backup_restore_testing_selection" "backup_restore_testing_selection_s3" {
  count = var.backup_plan_config_s3.enable ? 1 : 0
  name                      = "${local.csi_underscore}_s3_backup_restore"
  restore_testing_plan_name = "${local.csi_underscore}_restore_testing_plan"
  protected_resource_type   = "S3"
  iam_role_arn              = aws_iam_role.backup.arn
  protected_resource_conditions {
    string_equals {
      key   = "aws:ResourceTag/${var.backup_plan_config_s3.selection_tag}"
      value = "True"
    }
  }

  restore_metadata_overrides = {
    EncryptionType = "SSE_KMS"
    KmsKey         = aws_kms_alias.backup_key.arn
  }
}
