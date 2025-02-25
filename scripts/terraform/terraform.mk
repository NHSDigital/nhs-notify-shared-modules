# This file is for you! Edit it to implement your own Terraform make targets.

# ==============================================================================
# Custom implementation - implementation of a make target should not exceed 5 lines of effective code.
# In most cases there should be no need to modify the existing make targets.

terraform-fmt: # Format Terraform files - optional: terraform_dir|dir=[path to a directory where the command will be executed, relative to the project's top-level directory, default is one of the module variables or the example directory, if not set], terraform_opts|opts=[options to pass to the Terraform fmt command, default is '-recursive'] @Quality
	make _terraform cmd="fmt" \
		dir=$(or ${terraform_dir}, ${dir}) \
		opts=$(or ${terraform_opts}, ${opts})

_terraform: # Terraform command wrapper - mandatory: cmd=[command to execute]; optional: dir=[path to a directory where the command will be executed, relative to the project's top-level directory, default is one of the module variables or the example directory, if not set], opts=[options to pass to the Terraform command, default is none/empty]
	# 'TERRAFORM_STACK' is passed to the functions as environment variable
	TERRAFORM_STACK=$(or ${TERRAFORM_STACK}, $(or ${terraform_stack}, $(or ${STACK}, ${stack})))
	dir=$(or ${dir}, ${TERRAFORM_STACK})
	. "scripts/terraform/terraform.lib.sh"; \
	terraform-${cmd} # 'dir' and 'opts' are accessible by the function as environment variables, if set

# ==============================================================================
# Quality checks - please DO NOT edit this section!

terraform-shellscript-lint: # Lint all Terraform module shell scripts @Quality
	for file in $$(find scripts/terraform -type f -name "*.sh"); do
		file=$${file} scripts/shellscript-linter.sh
	done

terraform-sec: # TFSEC check against Terraform files - optional: terraform_dir|dir=[path to a directory where the command will be executed, relative to the project's top-level directory, default is one of the module variables or the example directory, if not set], terraform_opts|opts=[options to pass to the Terraform fmt command, default is '-recursive'] @Quality
	tfsec infrastructure/modules \
		--force-all-dirs \
		--exclude-downloaded-modules \
		--config-file scripts/config/tfsec.yaml

terraform-docs: # Terraform-docs check against Terraform files - optional: terraform_dir|dir=[path to a directory where the command will be executed, relative to the project's top-level directory, default is one of the module variables or the example directory, if not set], terraform_opts|opts=[options to pass to the Terraform fmt command, default is '-recursive'] @Quality
	for dir in ./infrastructure/modules/*; do \
		if [ -d "$$dir" ]; then \
			./scripts/terraform/terraform-docs.sh $$dir; \
		fi \
	done

# ==============================================================================
# Configuration - please DO NOT edit this section!

terraform-install: # Install Terraform @Installation
	make _install-dependency name="terraform"

# ==============================================================================

${VERBOSE}.SILENT: \
	_terraform \
	clean \
	terraform-apply \
	terraform-destroy \
	terraform-example-clean \
	terraform-example-destroy-aws-infrastructure \
	terraform-example-provision-aws-infrastructure \
	terraform-fmt \
	terraform-docs \
	terraform-init \
	terraform-install \
	terraform-plan \
	terraform-shellscript-lint \
	terraform-validate \
