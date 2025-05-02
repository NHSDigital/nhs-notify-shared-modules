resource "aws_oam_link" "cross_account_obs" {
  count           = var.oam_sink_id != "" ? 1 : 0
  label_template  = "$AccountName"
  resource_types  = [
    "AWS::CloudWatch::Metric",
    "AWS::Logs::LogGroup"
  ]
  sink_identifier = "arn:aws:oam:${var.region}:${var.observability_account_id}:sink/${var.oam_sink_id}"
  tags            = var.default_tags
}

data "aws_iam_policy" "cloudwatch_read_only" {
  count = var.oam_sink_id != "" ? 1 : 0
  name  = "CloudWatchReadOnlyAccess"
}

data "aws_iam_policy" "cloudwatch_automatic_dashboards" {
  count = var.oam_sink_id != "" ? 1 : 0
  name  = "CloudWatchAutomaticDashboardsAccess"
}

data "aws_iam_policy" "aws_xray_read_only" {
  count = var.oam_sink_id != "" ? 1 : 0
  name  = "AWSXrayReadOnlyAccess"
}

data "aws_iam_policy_document" "cross_account_obs_assume_role_policy" {
  count = var.oam_sink_id != "" ? 1 : 0
  statement {
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = [var.observability_account_id]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "cross_account_obs_role" {
  count              = var.oam_sink_id != "" ? 1 : 0
  name               = "CloudWatch-CrossAccountSharingRole"
  assume_role_policy = data.aws_iam_policy_document.cross_account_obs_assume_role_policy[0].json
}

resource "aws_iam_role_policy_attachment" "cloudwatch_read_only_attachment" {
  count      = var.oam_sink_id != "" ? 1 : 0
  policy_arn = data.aws_iam_policy.cloudwatch_read_only[0].arn
  role       = aws_iam_role.cross_account_obs_role[0].name
}

resource "aws_iam_role_policy_attachment" "cloudwatch_automatic_dashboards_attachment" {
  count      = var.oam_sink_id != "" ? 1 : 0
  policy_arn = data.aws_iam_policy.cloudwatch_automatic_dashboards[0].arn
  role       = aws_iam_role.cross_account_obs_role[0].name
}

resource "aws_iam_role_policy_attachment" "aws_xray_read_only_attachment" {
  count      = var.oam_sink_id != "" ? 1 : 0
  policy_arn = data.aws_iam_policy.aws_xray_read_only[0].arn
  role       = aws_iam_role.cross_account_obs_role[0].name
}
