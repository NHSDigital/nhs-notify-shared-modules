resource "aws_backup_vault_policy" "main" {
  backup_vault_name = aws_backup_vault.main.name
  policy            = data.aws_iam_policy_document.vault_policy.json
}

data "aws_iam_policy_document" "vault_policy" {
  statement {
    sid    = "DenyApartFromTerraform"
    effect = "Deny"

    principals {
      type        = "AWS"
      identifiers = ["*"]
    }

    condition {
      test     = "ArnNotEquals"
      values   = [var.management_ci_role_arn]
      variable = "aws:PrincipalArn"
    }

    actions = [
      "backup:DeleteRecoveryPoint",
      "backup:PutBackupVaultAccessPolicy",
      "backup:UpdateRecoveryPointLifecycle"
    ]

    resources = ["*"]
  }


  # Allow Org to copy to vault as cross-account sharing directly is now restricted by SCP
  statement {
    sid    = "BackupVaultAccess"
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = ["*"]
    }

    actions = [
      "backup:CopyIntoBackupVault"
    ]

    resources = [aws_backup_vault.main.arn]
    condition {
      test     = "StringEquals"
      values   = [var.principal_org_id]
      variable = "aws:PrincipalOrgID"
    }
  }


  dynamic "statement" {
    for_each = var.backup_copy_vault_arn != "" && var.backup_copy_vault_account_id != "" ? [1] : []
    content {
      sid    = "Allow account to copy into backup vault"
      effect = "Allow"

      actions   = ["backup:CopyIntoBackupVault"]
      resources = ["*"]

      principals {
        type        = "AWS"
        identifiers = ["arn:aws:iam::${var.backup_copy_vault_account_id}:root"]
      }
    }
  }
}
