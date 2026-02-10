resource "aws_s3_object" "lambda" {
  count  = var.package_type == "Zip" ? 1 : 0
  bucket = var.function_s3_bucket
  key    = "${local.csi}.zip"
  source = data.archive_file.lambda[0].output_path

  source_hash = var.force_lambda_code_deploy ? data.archive_file.lambda[0].output_base64sha256 : null

  metadata = {
    hash     = data.archive_file.lambda[0].output_base64sha256
    function = local.csi
    commit   = try(data.external.git_commit.result["sha"], "null")
  }

  lifecycle {
    ignore_changes = [
      metadata["commit"]
    ]
  }
}
