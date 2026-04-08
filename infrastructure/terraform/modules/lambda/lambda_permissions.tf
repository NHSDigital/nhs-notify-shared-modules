resource "aws_lambda_permission" "main" {
  for_each = { for statement in var.permission_statements : statement.statement_id => statement }

  action         = try(each.value.action, "lambda:InvokeFunction")
  function_name  = local.csi
  principal      = each.value.principal
  source_arn     = try(each.value.source_arn, null)
  source_account = try(each.value.source_account, null)
  statement_id   = each.value.statement_id
}
