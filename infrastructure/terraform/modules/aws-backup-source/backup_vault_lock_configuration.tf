resource "aws_backup_vault_lock_configuration" "main" {
  backup_vault_name   = aws_backup_vault.main.name
  changeable_for_days = 30
  max_retention_days  = var.vault_max_retention_days
  min_retention_days  = var.vault_min_retention_days
}
