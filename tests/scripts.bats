setup() {
    PROJECT_ROOT="$(cd "$(dirname "$BATS_TEST_FILENAME")/.." && pwd)"
}

@test "fetch-source.sh is valid bash" {
    bash -n "$PROJECT_ROOT/scripts/fetch-source.sh"
}

@test "apply-patches.sh is valid bash" {
    bash -n "$PROJECT_ROOT/scripts/apply-patches.sh"
}

@test "build.sh is valid bash" {
    bash -n "$PROJECT_ROOT/scripts/build.sh"
}

@test "fetch-source.sh is executable" {
    [ -x "$PROJECT_ROOT/scripts/fetch-source.sh" ]
}

@test "apply-patches.sh is executable" {
    [ -x "$PROJECT_ROOT/scripts/apply-patches.sh" ]
}

@test "build.sh is executable" {
    [ -x "$PROJECT_ROOT/scripts/build.sh" ]
}
