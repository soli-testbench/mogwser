setup() {
    PROJECT_ROOT="$(cd "$(dirname "$BATS_TEST_FILENAME")/.." && pwd)"
}

@test "Makefile exists" {
    [ -f "$PROJECT_ROOT/Makefile" ]
}

@test "mozconfig exists" {
    [ -f "$PROJECT_ROOT/mozconfig" ]
}

@test "scripts directory exists" {
    [ -d "$PROJECT_ROOT/scripts" ]
}

@test "patches directory exists" {
    [ -d "$PROJECT_ROOT/patches" ]
}

@test "Dockerfile exists" {
    [ -f "$PROJECT_ROOT/Dockerfile" ]
}

@test "README.md exists" {
    [ -f "$PROJECT_ROOT/README.md" ]
}
