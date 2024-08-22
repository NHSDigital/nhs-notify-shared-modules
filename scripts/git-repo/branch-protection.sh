#!/bin/bash

curl --location "https://api.github.com/repos/NHSDigital/$1/rulesets" \
--header 'X-GitHub-Api-Version: 2022-11-28' \
--header 'Accept: application/vnd.github+json' \
--header "Authorization: Bearer $2" \
--header 'Content-Type: application/json' \
--data '{
    "name": "nhs-notify-default",
    "target": "branch",
    "enforcement": "active",
    "conditions": {
        "ref_name": {
            "exclude": [],
            "include": [
                "~DEFAULT_BRANCH"
            ]
        }
    },
    "rules": [
        {
            "type": "deletion"
        },
        {
            "type": "non_fast_forward"
        },
        {
            "type": "pull_request",
            "parameters": {
                "required_approving_review_count": 1,
                "dismiss_stale_reviews_on_push": true,
                "require_code_owner_review": true,
                "require_last_push_approval": true,
                "required_review_thread_resolution": true
            }
        },
        {
            "type": "required_signatures"
        },
        {
            "type": "required_status_checks",
            "parameters": {
                "strict_required_status_checks_policy": true,
                "required_status_checks": []
            }
        }
    ]
}'
