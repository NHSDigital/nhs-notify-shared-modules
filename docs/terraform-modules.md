---
layout: default
title: Terraform Modules
parent: Home
nav_order: 2
has_children: true
---

## Terraform Modules

Reusable Terraform modules for consistent, secure infrastructure patterns across NHS Notify services.

### Available Modules

{% for module in site.pages %}
  {% if module.dir contains '/terraform-modules/' and module.name != 'index.md' and module.name != 'README.md' %}

- [{{ module.title }}]({{ module.url | relative_url }})
  {% endif %}
{% endfor %}

### Usage

Reference modules from GitHub releases:

```hcl
module "example" {
  source = "github.com/NHSDigital/nhs-notify-shared-modules//infrastructure/terraform/modules/MODULE_NAME?ref=vX.Y.Z"

  # Module-specific variables...
}
```

See individual module documentation for specific inputs, outputs, and examples.

### How It Works

The documentation uses a custom Jekyll plugin (`_plugins/external_markdown.rb`) to include module READMEs without duplicating content. The module READMEs in `infrastructure/terraform/modules/` are the single source of truth, and the docs pages simply include them.

### Adding a New Module

To document a new Terraform module:

1. Create a new `.md` file in `docs/terraform-modules/` named after your module
2. Add appropriate frontmatter:

   ```yaml
   ---
   layout: default
   title: Module Name
   parent: Terraform Modules
   nav_order: N
   ---
   ```

3. Use the `external_markdown` tag to include the README:

   ```liquid
   {% external_markdown infrastructure/terraform/modules/MODULE_NAME/README.md %}
   ```

The module README is automatically included and rendered with full markdown support including tables.
