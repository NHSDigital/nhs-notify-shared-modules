resource "aws_oam_link" "cross_account_obs" {
  label_template  = "$AccountName"
  resource_types  = var.resource_types
  sink_identifier = "arn:aws:oam:${var.region}:${var.observability_account_id}:sink/${var.oam_sink_id}"
  tags            = var.default_tags

  link_configuration {
    dynamic "log_group_configuration" {
      for_each = var.log_group_configuration != null ? [var.log_group_configuration] : []
      content {
        filter = log_group_configuration.value.filter
      }
    }

    dynamic "metric_configuration" {
      for_each = var.metric_configuration != null ? [var.metric_configuration] : []
      content {
        filter = metric_configuration.value.filter
      }
    }
  }
}

data "aws_iam_policy" "cloudwatch_read_only" {
  name = "CloudWatchReadOnlyAccess"
}

data "aws_iam_policy" "cloudwatch_automatic_dashboards" {
  name = "CloudWatchAutomaticDashboardsAccess"
}

data "aws_iam_policy" "aws_xray_read_only" {
  name = "AWSXrayReadOnlyAccess"
}

data "aws_iam_policy_document" "cross_account_obs_assume_role_policy" {
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
  name               = "CloudWatch-CrossAccountSharingRole"
  assume_role_policy = data.aws_iam_policy_document.cross_account_obs_assume_role_policy.json
}

resource "aws_iam_role_policy_attachment" "cloudwatch_read_only_attachment" {
  policy_arn = data.aws_iam_policy.cloudwatch_read_only.arn
  role       = aws_iam_role.cross_account_obs_role.name
}

resource "aws_iam_role_policy_attachment" "cloudwatch_automatic_dashboards_attachment" {
  policy_arn = data.aws_iam_policy.cloudwatch_automatic_dashboards.arn
  role       = aws_iam_role.cross_account_obs_role.name
}

resource "aws_iam_role_policy_attachment" "aws_xray_read_only_attachment" {
  policy_arn = data.aws_iam_policy.aws_xray_read_only.arn
  role       = aws_iam_role.cross_account_obs_role.name
}
