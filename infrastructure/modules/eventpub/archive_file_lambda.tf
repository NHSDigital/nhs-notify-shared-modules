resource "archive_file" "lambda" {
  type        = "zip"
  source_dir  = "${path.module}/lambda/eventpub/src"

  # Timestamp in path to resolve https://github.com/hashicorp/terraform-provider-archive/issues/39
  output_path = "${path.module}/lambda/eventpub_${timestamp()}.zip"
  excludes = [
    # NodeJS Exclusions
    "**/__tests__",
    "**/node_modules",
    "**/package.json",
    "**/package-lock.json",
  ]
}
