# Terraform Make Targets for Shared Modules
# This repository contains only Terraform modules (no components or tfscaffold)
# Modules are located in infrastructure/modules/

# ==============================================================================
# Formatting and Validation

terraform-fmt: # Format Terraform module files @Quality
	# Example: make terraform-fmt
	@cd infrastructure && terraform fmt -recursive modules

terraform-fmt-check: # Check Terraform module formatting @Quality
	# Example: make terraform-fmt-check
	@cd infrastructure && terraform fmt -check -recursive modules

terraform-validate: # Validate a specific Terraform module - mandatory: module=[module_name] @Quality
	# Example: make terraform-validate module=mymodule
	# Note: Validation does not require environment/group as it checks syntax only
	cd infrastructure/modules/$(module) && \
	terraform init -backend=false && \
	terraform validate

terraform-validate-all: # Validate all Terraform modules @Quality
	# Example: make terraform-validate-all
	@for dir in infrastructure/modules/*; do \
		if [ -d "$$dir" ]; then \
			echo "Validating $$(basename $$dir)..."; \
			temp_provider=false; \
			if grep -q "configuration_aliases.*us-east-1" "$$dir/versions.tf" 2>/dev/null; then \
				echo "provider \"aws\" { alias = \"us-east-1\"; region = \"us-east-1\" }" > "$$dir/.tmp_providers.tf"; \
				temp_provider=true; \
			fi; \
			cd $$dir && \
			terraform init -backend=false && \
			terraform validate; \
			validation_result=$$?; \
			cd - > /dev/null; \
			if [ "$$temp_provider" = "true" ]; then \
				rm -f "$$dir/.tmp_providers.tf"; \
			fi; \
			if [ $$validation_result -ne 0 ]; then \
				exit $$validation_result; \
			fi; \
		fi; \
	done

terraform-sec: # Run Trivy IaC security scanning on Terraform modules @Quality
	# Example: make terraform-sec
	./scripts/terraform/trivy-scan.sh --mode iac infrastructure/modules

terraform-docs: # Generate Terraform module documentation - optional: module=[specific module, or all if omitted] @Quality
	# Example: make terraform-docs module=mymodule
	# Example: make terraform-docs (generates for all modules)
	@if [ -n "$(module)" ]; then \
		./scripts/terraform/terraform-docs.sh infrastructure/modules/$(module); \
	else \
		for dir in infrastructure/modules/*; do \
			if [ -d "$$dir" ]; then \
				./scripts/terraform/terraform-docs.sh $$dir; \
			fi; \
		done; \
	fi

# ==============================================================================
# Cleanup

clean:: # Remove Terraform build artifacts and cache @Operations
	# Example: make clean
	rm -rf infrastructure/modules/*/.terraform
	rm -rf infrastructure/modules/*/.terraform.lock.hcl

# ==============================================================================
# Installation

terraform-install: # Install Terraform using asdf @Installation
	# Example: make terraform-install
	make _install-dependency name="terraform"

# ==============================================================================

${VERBOSE}.SILENT: \
	clean \
	terraform-docs \
	terraform-fmt \
	terraform-fmt-check \
	terraform-install \
	terraform-sec \
	terraform-validate \
	terraform-validate-all
