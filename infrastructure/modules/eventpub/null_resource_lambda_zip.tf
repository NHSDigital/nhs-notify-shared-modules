resource "null_resource" "lambda_zip" {
  provisioner "local-exec" {
    command = <<EOT
      cd "${path.module}/lambda/eventpub/src" && \
      zip -r ../eventpub.zip . \
        -x "**/__tests__/*" "**/node_modules/*" "**/package.json" "**/package-lock.json"
    EOT
  }

  triggers = {
    always_run = timestamp()
  }
}
