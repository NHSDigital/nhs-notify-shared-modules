resource "aws_iam_role" "firehose_role" {
  count = var.enable_event_cache ? 1 : 0

  name               = "${local.csi}-firehose-role"
  assume_role_policy = data.aws_iam_policy_document.firehose_assume_role[0].json
}

data "aws_iam_policy_document" "firehose_assume_role" {
  count = var.enable_event_cache ? 1 : 0

  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["firehose.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role_policy_attachment" "s3_write_object" {
  count = var.enable_event_cache ? 1 : 0

  role       = aws_iam_role.firehose_role[0].name
  policy_arn = aws_iam_policy.s3_write_object[0].arn
}

resource "aws_iam_policy" "s3_write_object" {
  count = var.enable_event_cache ? 1 : 0

  name        = "${local.csi}-${var.name}-s3-write-object"
  description = "S3 Put Object policy for ${local.csi}-${var.name} Firehose"
  policy      = data.aws_iam_policy_document.s3_write_object[0].json
}

data "aws_iam_policy_document" "s3_write_object" {
  count = var.enable_event_cache ? 1 : 0

  statement {
    sid    = "AllowWriteObject"
    effect = "Allow"

    actions = [
      "s3:AbortMultipartUpload",
      "s3:GetBucketLocation",
      "s3:GetObject",
      "s3:ListBucket",
      "s3:ListBucketMultipartUploads",
      "s3:PutObject",
      "s3:PutObject",
    ]

    resources = [
      "${module.s3bucket_event_cache[0].arn}/*",
    ]
  }
}
