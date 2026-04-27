resource "aws_iam_role" "sns_role" {
  name               = "${local.csi}-sns-role"
  assume_role_policy = data.aws_iam_policy_document.sns_assume_role.json
}

resource "aws_iam_policy" "firehose_delivery" {
  count = var.enable_event_cache ? 1 : 0

  name        = "${local.csi}-${var.name}-firehose-delivery"
  description = "Delivery Policy for ${local.csi}-${var.name} Firehose"
  policy      = data.aws_iam_policy_document.firehose_delivery[0].json
}

resource "aws_iam_role_policy_attachment" "firehose_delivery" {
  count = var.enable_event_cache ? 1 : 0

  role       = aws_iam_role.sns_role.name
  policy_arn = aws_iam_policy.firehose_delivery[0].arn
}


data "aws_iam_policy_document" "sns_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["sns.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

data "aws_iam_policy_document" "firehose_delivery" {
  count = var.enable_event_cache ? 1 : 0

  statement {
    sid    = "AllowFirehoseDelivery"
    effect = "Allow"

    actions = [
      "firehose:PutRecord",
      "firehose:PutRecordBatch"
    ]

    resources = [
      "${aws_kinesis_firehose_delivery_stream.main[0].arn}",
    ]
  }
}
