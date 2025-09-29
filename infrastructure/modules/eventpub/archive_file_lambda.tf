data "archive_file" "lambda" {
  type        = "zip"
  source_dir  = "${path.module}/lambda/eventpub/src"
  output_path = "${path.module}/lambda/${local.csi}_eventpub.zip"

  excludes = [
    # NodeJS Exclusions
    "**/__tests__",
    "**/node_modules",
    "**/package.json",
    "**/package-lock.json",
  ]

  depends_on = [null_resource.force_archive]
}
