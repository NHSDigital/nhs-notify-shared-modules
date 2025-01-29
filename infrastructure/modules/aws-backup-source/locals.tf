locals {
  csi = format(
    "%s-%s-%s-%s",
    var.project,
    var.environment,
    var.component,
    "backup"
  )

  csi_underscore = replace(local.csi,"-","_")

  default_tags = merge(
    var.default_tags,
    {
      Name = local.csi
    },
  )
}
