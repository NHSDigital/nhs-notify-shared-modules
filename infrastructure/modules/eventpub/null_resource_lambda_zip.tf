resource "null_resource" "lambda_zip" {
  triggers = {
    always_run = timestamp()
  }
  provisioner "local-exec" {
    command = <<EOT
      cd "${path.module}/lambda/eventpub/src" && \
      zip -r ../eventpub.zip . \
        -x "**/__tests__/*" "**/node_modules/*" "**/package.json" "**/package-lock.json"
    EOT
  }
}
