module "s3bucket_event_cache" {
  source = "https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.30/terraform-s3bucket.zip"

  count = var.enable_event_cache ? 1 : 0

  name = "event_cache"

  aws_account_id = var.aws_account_id
  region         = var.region
  project        = var.project
  environment    = var.environment
  component      = var.component

  acl           = "private"
  force_destroy = var.force_destroy
  versioning    = true

  lifecycle_rules = [
    {
      enabled = true

      noncurrent_version_transition = [
        {
          noncurrent_days = "30"
          storage_class   = "STANDARD_IA"
        }
      ]

      noncurrent_version_expiration = {
        noncurrent_days = "90"
      }

      abort_incomplete_multipart_upload = {
        days = "1"
      }
    }
  ]

  policy_documents = concat(
    [data.aws_iam_policy_document.s3bucket_event_cache[0].json],
    var.additional_policies_for_event_cache_bucket
  )

  public_access = {
    block_public_acls       = true
    block_public_policy     = true
    ignore_public_acls      = true
    restrict_public_buckets = true
  }

  default_tags = {
    Name = "Event Cache Storage"
  }
}

data "aws_iam_policy_document" "s3bucket_event_cache" {
  count = var.enable_event_cache ? 1 : 0

  statement {
    sid    = "DontAllowNonSecureConnection"
    effect = "Deny"

    actions = [
      "s3:*",
    ]

    resources = [
      module.s3bucket_event_cache[0].arn,
      "${module.s3bucket_event_cache[0].arn}/*",
    ]

    principals {
      type = "AWS"

      identifiers = [
        "*",
      ]
    }

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"

      values = [
        "false",
      ]
    }
  }

  statement {
    sid    = "AllowManagedAccountsToList"
    effect = "Allow"

    actions = [
      "s3:ListBucket",
    ]

    resources = [
      module.s3bucket_event_cache[0].arn,
    ]

    principals {
      type = "AWS"
      identifiers = [
        "arn:aws:iam::${var.aws_account_id}:root"
      ]
    }
  }

  statement {
    sid    = "AllowManagedAccountsToGet"
    effect = "Allow"

    actions = [
      "s3:GetObject",
    ]

    resources = [
      "${module.s3bucket_event_cache[0].arn}/*",
    ]

    principals {
      type = "AWS"
      identifiers = [
        "arn:aws:iam::${var.aws_account_id}:root"
      ]
    }
  }
}
