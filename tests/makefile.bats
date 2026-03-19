setup() {
    PROJECT_ROOT="$(cd "$(dirname "$BATS_TEST_FILENAME")/.." && pwd)"
}

@test "Makefile contains fetch target" {
    grep -q '^fetch:' "$PROJECT_ROOT/Makefile"
}

@test "Makefile contains build target" {
    grep -q '^build:' "$PROJECT_ROOT/Makefile"
}

@test "Makefile contains test target" {
    grep -q '^test:' "$PROJECT_ROOT/Makefile"
}

@test "Makefile contains setup target" {
    grep -q '^setup:' "$PROJECT_ROOT/Makefile"
}

@test "Makefile contains clean target" {
    grep -q '^clean:' "$PROJECT_ROOT/Makefile"
}

@test "make -n setup dry-run succeeds" {
    cd "$PROJECT_ROOT"
    make -n setup
}
