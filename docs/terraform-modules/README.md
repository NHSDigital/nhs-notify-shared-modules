# Terraform Modules Documentation

This directory contains documentation pages for the Terraform modules in `infrastructure/terraform/modules/`.

## How It Works

The documentation uses a custom Jekyll plugin (`_plugins/external_markdown.rb`) to include the module READMEs without duplicating content.

### Plugin: `external_markdown`

The `external_markdown` Liquid tag allows you to include markdown files from outside the docs directory:

```liquid
{% external_markdown path/to/file.md %}
```

The path is relative to the repository root (parent of the docs/ folder).

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

### Benefits

- **No Duplication**: Module READMEs are the single source of truth
- **Always Up-to-Date**: Documentation automatically reflects changes to module READMEs
- **No Build Scripts**: Pure Jekyll solution with no pre-processing needed
- **Easy to Maintain**: Just add a simple stub page for each new module

### Example

See `terraform-modules/lambda.md` for a complete example.
