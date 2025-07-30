#!/bin/bash

# Check if module name is provided
if [ -z "$1" ]; then
    echo "Error: Module name is required"
    echo "Usage: $0 <module_name>"
    exit 1
fi

MODULE_NAME="$1"

CARGO_CMD="cargo stylus new \"$MODULE_NAME\""

echo "Creating new module: $MODULE_NAME"

if output=$(eval $CARGO_CMD 2>&1); then
    cd "$MODULE_NAME"
    # Remove unnecessary files
    rm -rf .git .github ci .gitignore examples licenses .env.example header.png README.md
    # Update Cargo.toml name field to $MODULE_NAME
    if [ -f Cargo.toml ]; then
        sed -i "s/^name = \".*\"/name = \"$MODULE_NAME\"/" Cargo.toml
    fi
    # Update main.rs module name in print_from_args call
    if [ -f src/main.rs ]; then
        MODULE_NAME_UNDERSCORE=$(echo "$MODULE_NAME" | tr '-' '_')
        sed -i "s/^[[:space:]]*stylus_hello_world::print_from_args();/\t$MODULE_NAME_UNDERSCORE::print_from_args();/" src/main.rs
    fi
    cargo generate-lockfile
    echo "New module created successfully"
else
    echo "Error: Failed to create new module with '$CARGO_CMD'"
    echo "$output"
    exit 1
fi
