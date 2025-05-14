resource "aws_iam_policy" "put_logs" {
  name        = "${local.csi}-put-logs"
  description = "Logging policy for ${var.function_name} Lambda"
  policy      = data.aws_iam_policy_document.put_logs.json
}
