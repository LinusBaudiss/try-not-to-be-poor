#!/usr/bin/env sh
set -eu
PROJECT_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$PROJECT_ROOT"
./backend/mvnw -B -f backend/pom.xml test-compile \
  org.apache.maven.plugins:maven-dependency-plugin:3.8.1:build-classpath \
  -Dmdep.outputFile=target/test-classpath.txt -DincludeScope=test
TEST_CLASSPATH=$(cat "$PROJECT_ROOT/backend/target/test-classpath.txt")
exec "${JAVA_HOME:+$JAVA_HOME/bin/}java" \
  -cp "$PROJECT_ROOT/backend/target/test-classes:$PROJECT_ROOT/backend/target/classes:$TEST_CLASSPATH" \
  de.linus.tnbp.access.E2eServer
