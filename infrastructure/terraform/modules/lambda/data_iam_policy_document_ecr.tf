data "aws_iam_policy_document" "ecr" {
  statement {
    effect = "Allow"

    actions = [
      "ecr:GetAuthorizationToken",
    ]

    resources = ["*"]
  }

  statement {
    effect = "Allow"

    actions = [
      "ecr:BatchGetImage",
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchCheckLayerAvailability",
    ]

    resources = [
      for repo_name in var.image_repository_names :
      "arn:aws:ecr:${var.region}:${var.aws_account_id}:repository/${repo_name}"
    ]
  }
}
